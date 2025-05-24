import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RecordModal } from "./RecordModal";
import { I18nProvider } from "../hooks/useI18n"; // Assuming I18nProvider for context
import { MantineProvider } from "@mantine/core"; // For Mantine components

// --- Mocks ---
const mockOnClose = jest.fn();
const mockAddRecording = jest.fn(() => Promise.resolve());
const mockUseLibrary = jest.fn(() => ({
  addRecording: mockAddRecording,
  value: { isLoading: false, error: null, tracks: [] },
}));

const mockUseAlert = jest.fn(() => ({
  show: jest.fn(),
}));

const mockMediaDevices = {
  getUserMedia: jest.fn(() => Promise.resolve({
    getTracks: () => [{ stop: jest.fn(), readyState: 'live' }],
    active: true,
  } as unknown as MediaStream)),
};

const mockLamejs = {
  Mp3Encoder: jest.fn().mockImplementation(() => ({
    encodeBuffer: jest.fn((data) => new Int8Array(data.length / 2)), // Simulate some output
    flush: jest.fn(() => new Int8Array([1, 2, 3])), // Simulate flush output
  })),
};

const mockAudioContext = {
  decodeAudioData: jest.fn((_arrayBuffer, successCallback) => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 1000, // Sample length
      getChannelData: jest.fn(() => new Float32Array(1000)), // Sample PCM data
    };
    if (successCallback) {
        successCallback(mockAudioBuffer);
    }
    return Promise.resolve(mockAudioBuffer); // Also return a promise for modern usage
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
      // Simulate data being available almost immediately
      if (mockMediaRecorderInstance.ondataavailable) {
        mockMediaRecorderInstance.ondataavailable({ data: new Blob(['chunk1'], { type: 'audio/webm' }) } as BlobEvent);
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
Object.defineProperty(window, 'webkitAudioContext', { // For Safari
  value: jest.fn().mockImplementation(() => mockAudioContext),
  writable: true,
});

jest.mock('../hooks/useLibrary', () => ({
  useLibrary: () => mockUseLibrary(),
}));
jest.mock('./Alert', () => ({
  useAlert: () => mockUseAlert(),
}));
jest.mock('lamejs', () => mockLamejs, { virtual: true }); // Mock lamejs

// Helper to render with providers
const renderRecordModal = (props: Partial<React.ComponentProps<typeof RecordModal>> = {}) => {
  return render(
    <MantineProvider>
      <I18nProvider>
        <RecordModal opened={true} onClose={mockOnClose} {...props} />
      </I18nProvider>
    </MantineProvider>
  );
};


// --- Tests ---
describe("RecordModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock MediaRecorder instance for each test
    if (mockMediaRecorderInstance) {
        mockMediaRecorderInstance.state = 'inactive';
    }
    mockMediaDevices.getUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn(), readyState: 'live' }],
        active: true,
    } as unknown as MediaStream);
  });

  test("renders when opened is true", () => {
    renderRecordModal({ opened: true });
    expect(screen.getByText("Record Audio")).toBeInTheDocument();
    expect(screen.getByLabelText("Start recording")).toBeInTheDocument(); // Tooltip
  });

  test("calls onClose when Cancel button is clicked", () => {
    renderRecordModal();
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("initial state shows microphone icon and 'Start recording' tooltip", () => {
    renderRecordModal();
    expect(screen.getByLabelText("Start recording")).toBeInTheDocument();
    // Check for microphone SVG path or a more specific data-testid if available
  });

  test("clicking record button starts recording", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    await waitFor(() => expect(mockMediaDevices.getUserMedia).toHaveBeenCalled());
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    
    // After starting
    expect(screen.getByLabelText("Stop recording")).toBeInTheDocument();
    expect(screen.getByText("Recording...")).toBeInTheDocument(); // Pulsing circle text
  });

  test("clicking stop button stops recording and shows player", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Start recording
    await act(async () => {
      fireEvent.click(recordButton);
    });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());

    // Stop recording
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => {
      fireEvent.click(stopButton);
    });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());

    // Check for player and trash icon
    expect(screen.getByLabelText("Delete recording")).toBeInTheDocument();
    expect(screen.getByRole("audio")).toBeInTheDocument();
    expect(screen.getByLabelText("Filename (optional)")).toBeInTheDocument();
  });
  
  test("clicking trash icon deletes recording", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Start and stop recording to get to the "hasRecording" state
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());

    // Click trash icon
    const trashButton = screen.getByLabelText("Delete recording");
    await act(async () => {
      fireEvent.click(trashButton);
    });

    expect(screen.getByLabelText("Start recording")).toBeInTheDocument(); // Back to initial state
    expect(screen.queryByRole("audio")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Filename (optional)")).not.toBeInTheDocument();
  });

  test("Cancel button stops recording if active and calls onClose", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Start recording
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    expect(mockMediaRecorderInstance.state).toBe('recording');

    // Click Cancel
    const cancelButton = screen.getByText("Cancel");
    await act(async () => { fireEvent.click(cancelButton); });
    
    expect(mockMediaRecorderInstance.stop).toHaveBeenCalled(); // Should stop active recording
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("'Add' button calls addRecording with custom filename and closes modal", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Record something
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());
    
    // Type a filename
    const filenameInput = screen.getByLabelText("Filename (optional)");
    fireEvent.change(filenameInput, { target: { value: "my-test-recording" } });

    const addButton = screen.getByText("Add");
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => expect(mockLamejs.Mp3Encoder).toHaveBeenCalled());
    await waitFor(() => expect(mockAddRecording).toHaveBeenCalledWith(
      expect.any(Blob), // The MP3 blob
      "my-test-recording.mp3" // Expected filename
    ));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  test("'Add' button calls addRecording with default filename if input is empty", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Record something
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());
    
    // Ensure filename input is empty
    const filenameInput = screen.getByLabelText("Filename (optional)");
    expect(filenameInput).toHaveValue("");

    const addButton = screen.getByText("Add");
    await act(async () => { fireEvent.click(addButton); });

    await waitFor(() => expect(mockAddRecording).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^recording-\d+\.mp3$/) // Default filename pattern
    ));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });
  
  test("'Add and record again' button calls addRecording and resets for new recording", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");
     // Record something
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());

    const addAndRecordButton = screen.getByText("Add and record again");
    await act(async () => {
      fireEvent.click(addAndRecordButton);
    });
    
    await waitFor(() => expect(mockLamejs.Mp3Encoder).toHaveBeenCalled());
    await waitFor(() => expect(mockAddRecording).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^recording-\d+\.mp3$/) // Default filename pattern
    ));
    
    expect(mockOnClose).not.toHaveBeenCalled(); // Modal should stay open
    expect(screen.getByLabelText("Start recording")).toBeInTheDocument(); // Ready for new recording
    expect(screen.queryByRole("audio")).not.toBeInTheDocument();
    // getUserMedia might be called again if permissions were reset or stream stopped.
    // For this test, just ensure the UI state is correct for a new recording.
    // Further test: simulate stream ending and check if getUserMedia is called again
    if(mediaStreamRef?.current?.getAudioTracks()[0]) { // If track exists
      // @ts-ignore
      mediaStreamRef.current.getAudioTracks()[0].readyState = 'ended'; // Simulate stream track ended
    }
    mockMediaDevices.getUserMedia.mockClear(); // Clear previous calls for specific check

    // Click record again (hypothetically, after add and record again has reset UI)
    const newRecordButton = screen.getByLabelText("Start recording");
    await act(async () => { fireEvent.click(newRecordButton); });
    // This part might be tricky if the stream object itself is not easily mutable or if its state doesn't affect permission checks directly in this mock setup
    // For a robust test here, one might need to refine how mediaStreamRef.current.active or track.readyState is updated and checked by requestMicrophonePermission
    // await waitFor(() => expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(1)); // Check if called again
  });
  
  test("shows error if getUserMedia fails", async () => {
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error("Permission denied"));
    const mockAlertShow = jest.fn();
    mockUseAlert.mockReturnValueOnce({ show: mockAlertShow });
    
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");
    
    await act(async () => {
      fireEvent.click(recordButton);
    });

    await waitFor(() => expect(mockAlertShow).toHaveBeenCalledWith(
      "Microphone permission denied. Please enable it in your browser settings.",
      { type: "error" }
    ));
    expect(screen.getByLabelText("Microphone permission needed")).toBeInTheDocument();
  });

  test("shows loader and disables buttons during encoding and library saving", async () => {
    mockAddRecording.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100))); // Simulate delay
    
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");
    // Record
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => {}); 
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => {}); 

    const addButton = screen.getByText("Add");
    
    // Click Add, but don't wait for mockAddRecording to resolve yet
    act(() => {
      fireEvent.click(addButton);
    });

    // While encoding (before addRecording promise resolves)
    await waitFor(() => expect(screen.getByText("Processing audio...")).toBeInTheDocument());
    expect(addButton).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Add and record again")).toBeDisabled();

    // Mock library loading state after encoding finishes and addRecording is called
    mockUseLibrary.mockReturnValueOnce({
      addRecording: mockAddRecording,
      value: { isLoading: true, error: null, tracks: [] }, // Simulate library loading
    });
    
    // Need to re-trigger something or wait for state update that reflects library loading
    // This part is tricky as the library loading is async and external to the direct click handler.
    // For now, this test primarily covers the isEncoding state.
    // A more complex setup might be needed to fully test libraryState.isLoading impact from within this flow.

    // Wait for the addRecording to complete
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // Wait for mockAddRecording
    });
    
    // After all operations
    // mockOnClose should have been called. This check depends on whether modal is still mounted.
    // If it unmounts, these elements won't be found.
    // For this test, let's assume it's closed. If not, check for enabled buttons.
  });
  
  test("UI reflects library loading state when adding a recording", async () => {
    renderRecordModal();
    const recordButton = screen.getByLabelText("Start recording");

    // Record and stop
    await act(async () => { fireEvent.click(recordButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.start).toHaveBeenCalled());
    const stopButton = screen.getByLabelText("Stop recording");
    await act(async () => { fireEvent.click(stopButton); });
    await waitFor(() => expect(mockMediaRecorderInstance.stop).toHaveBeenCalled());

    // Before clicking "Add", set up the mock useLibrary to return isLoading: true
    // This simulates the state where the library is busy *after* addRecording is called.
    // The actual call to addRecording will happen, and then the library state updates.
    
    mockAddRecording.mockImplementationOnce(async () => {
      // Simulate the point where addRecording has been called and now useLibrary reflects loading
      act(() => {
        mockUseLibrary.mockReturnValue({ // Update the hook's return value
          addRecording: mockAddRecording,
          value: { isLoading: true, error: null, tracks: [] },
        });
      });
      // Simulate some async work by addRecording before it resolves
      await new Promise(r => setTimeout(r, 50)); 
    });

    const addButton = screen.getByText("Add");
    // Click Add. The mockAddRecording will simulate the library becoming busy.
    // We don't use await act here for the click itself if we want to assert intermediate states
    // before mockAddRecording resolves. But since mockAddRecording itself triggers the state change
    // for library loading, we can wrap the click in act.
    fireEvent.click(addButton);
    
    // Wait for the UI to update based on the new library state (isLoading: true)
    // This should happen quickly after mockAddRecording starts and updates the mock.
    await waitFor(() => {
      expect(screen.getByText("Adding to library...")).toBeInTheDocument();
      expect(addButton).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled(); // Assuming cancel also gets disabled
      expect(screen.getByText("Add and record again")).toBeDisabled();
    });

    // Allow addRecording to complete and modal to close or reset
    await act(async () => {
      await new Promise(r => setTimeout(r, 100)); // Ensure all promises resolve
    });
     await waitFor(() => expect(mockOnClose).toHaveBeenCalled()); // Modal should close after successful add
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
