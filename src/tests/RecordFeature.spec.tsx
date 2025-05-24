import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MantineProvider } from "@mantine/core";
import { I18nProvider } from "../hooks/useI18n";
import { RecordModal } from "../components/RecordModal";
import { useLibrary, dispatch as dispatchLibraryEvent } from "../hooks/useLibrary"; // Import real hook and its dispatch
import { Track } from "../util/mp3/track"; // For type checking
import { setMany, getMany, keys as idbKeys, delMany } from 'idb-keyval'; // For IndexedDB checks

// --- Mocks for Browser APIs ---
const mockMediaDevices = {
  getUserMedia: jest.fn(() => Promise.resolve({
    getTracks: () => [{ stop: jest.fn(), readyState: 'live' }],
    active: true,
  } as unknown as MediaStream)),
};

const mockLamejs = {
  Mp3Encoder: jest.fn().mockImplementation(() => ({
    encodeBuffer: jest.fn((data) => new Int8Array(data.length / 2)),
    flush: jest.fn(() => new Int8Array([1, 2, 3])),
  })),
};

const mockAudioContext = {
  decodeAudioData: jest.fn((_arrayBuffer, successCallback) => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100 * 3, // 3 seconds of audio
      getChannelData: jest.fn(() => new Float32Array(44100 * 3)),
    };
     if (successCallback) {
        successCallback(mockAudioBuffer);
    }
    return Promise.resolve(mockAudioBuffer);
  }),
};

let mockMediaRecorderInstance: {
  start: jest.Mock;
  stop: jest.Mock;
  ondataavailable: ((event: Partial<BlobEvent>) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  state: string;
  mimeType: string;
};

global.MediaRecorder = jest.fn().mockImplementation(() => {
  mockMediaRecorderInstance = {
    start: jest.fn(() => {
      mockMediaRecorderInstance.state = 'recording';
      // Simulate data immediately for simplicity in test
      if (mockMediaRecorderInstance.ondataavailable) {
        mockMediaRecorderInstance.ondataavailable({ data: new Blob(['chunky'], {type: 'audio/webm'}) } as BlobEvent);
      }
    }),
    stop: jest.fn(() => {
      mockMediaRecorderInstance.state = 'inactive';
      if (mockMediaRecorderInstance.onstop) {
        mockMediaRecorderInstance.onstop();
      }
    }),
    ondataavailable: null,
    onstop: null,
    onerror: null,
    state: 'inactive',
    mimeType: 'audio/webm',
  };
  return mockMediaRecorderInstance;
}) as jest.Mock;

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
});
Object.defineProperty(window, 'AudioContext', {
  value: jest.fn().mockImplementation(() => mockAudioContext),
  writable: true,
});
Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn().mockImplementation(() => mockAudioContext),
  writable: true,
});
jest.mock('lamejs', () => mockLamejs, { virtual: true });
jest.mock('../components/Alert', () => ({ // Mock useAlert as it's not relevant to this integration
  useAlert: () => ({ show: jest.fn() }),
}));


// --- Test Component to Display Library Tracks ---
// This component will use the real useLibrary hook to display tracks
const TestAudioPanel = () => {
  const { value: library } = useLibrary(); // Uses the real hook
  if (library.isLoading && !library.tracks.length) return <div>Loading library...</div>;
  if (library.error) return <div>Error loading library: {library.error.message}</div>;

  return (
    <div>
      <h2>Tracks in Library:</h2>
      {library.tracks.length === 0 && <p>No tracks yet.</p>}
      <ul>
        {library.tracks.map((track: Track) => (
          <li key={track.fileName} data-testid={`track-${track.fileName}`}>
            {track.title} - {track.artist} ({track.duration.toFixed(2)}s)
            {/* Basic audio player - playback itself is hard to test in JSDOM */}
            {/* <audio data-testid={`audio-${track.fileName}`} src={track.fileName} /> */}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper to render with providers
const renderFeature = () => {
  const onCloseModal = jest.fn();
  render(
    <MantineProvider>
      <I18nProvider>
        {/* Render RecordModal as if it's opened by the toolbar */}
        <RecordModal opened={true} onClose={onCloseModal} />
        <TestAudioPanel />
      </I18nProvider>
    </MantineProvider>
  );
  return { onCloseModal };
};

describe("Recording Feature Integration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
     // Reset mock MediaRecorder instance for each test
    if (mockMediaRecorderInstance) {
        mockMediaRecorderInstance.state = 'inactive';
    }
    mockMediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn(), readyState: 'live' }],
        active: true,
    } as unknown as MediaStream);

    // Clear IndexedDB before each test to ensure a clean state
    const keys = await idbKeys();
    await delMany(keys as IDBValidKey[]); // Cast needed as idbKeys returns unknown[]
    // Re-initialize library state for each test
    dispatchLibraryEvent({ event: "init" }); 
    // Wait for library to initialize from empty IDB
    await waitFor(() => expect(screen.queryByText("Loading library...")).not.toBeInTheDocument(), { timeout: 2000});
  });

  test("can create a new recording, add it to the library, and see it displayed", async () => {
    renderFeature();

    // 1. Start recording in RecordModal
    const recordButton = screen.getByLabelText("Start recording");
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    expect(screen.getByLabelText("Stop recording")).toBeInTheDocument();

    // 2. Stop recording
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());
    expect(screen.getByLabelText("Delete recording")).toBeInTheDocument();
    expect(screen.getByRole("audio")).toBeInTheDocument(); // Audio player appears

    // 3. (Optional) Enter a filename
    const filename = "my-cool-live-recording.mp3";
    const filenameInput = screen.getByLabelText("Filename (optional)");
    fireEvent.change(filenameInput, { target: { value: filename } });

    // 4. Click "Add"
    const addButton = screen.getByText("Add");
    await act(async () => { fireEvent.click(addButton); });

    // 5. Verification
    // Wait for the track to appear in TestAudioPanel
    await waitFor(() => {
      expect(screen.getByTestId(`track-${filename}`)).toBeInTheDocument();
    }, { timeout: 4000 }); // Increased timeout for IDB operations + state updates

    const trackDisplay = screen.getByTestId(`track-${filename}`);
    expect(trackDisplay).toHaveTextContent("my-cool-live-recording"); // Title derived from filename
    expect(trackDisplay).toHaveTextContent("Unknown Artist");
    expect(trackDisplay).toHaveTextContent("3.00s"); // Duration from mockAudioBuffer (44100 * 3 samples)

    // Verify in IndexedDB (optional, but good for confidence)
    const trackDataFromDB = await getMany([`track:${filename}`, `data:${filename}`]);
    expect(trackDataFromDB[0]).toBeDefined();
    expect(trackDataFromDB[0].fileName).toBe(filename);
    expect(trackDataFromDB[0].duration).toBe(3); // Duration from mock
    expect(trackDataFromDB[1]).toBeInstanceOf(Blob); // MP3 blob
  });

  // Test for playback is very limited in JSDOM. We can check if src is set.
  // A more thorough test would require an end-to-end environment like Playwright/Cypress.
  test("recorded audio placeholder has a blob URL after recording", async () => {
    renderFeature();

    const recordButton = screen.getByLabelText("Start recording");
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());

    const audioElement = screen.getByRole("audio") as HTMLAudioElement;
    expect(audioElement.src).toMatch(/^blob:http:\/\/[^\/]+\/[\w-]+$/);
  });

});

// Mock for BlobEvent if not available in test environment (e.g. older JSDOM)
if (typeof BlobEvent === 'undefined') {
  // @ts-ignore
  global.BlobEvent = class BlobEvent extends Event {
    data: Blob;
    constructor(type: string, eventInitDict: { data: Blob }) {
      super(type);
      this.data = eventInitDict.data;
    }
  };
}
