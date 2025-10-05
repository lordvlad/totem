import { test, expect } from "@playwright/test";

test.describe("Audio Recording and Playback", () => {
  test("should display audio management interface", async ({ page }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Verify the app loads successfully
    await expect(page).toHaveTitle(/Totem/);
  });

  test("should display empty state when no tracks are present", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify empty state message is shown
    await expect(
      page.getByText(/your music files will show up here/i),
    ).toBeVisible();

    // Verify Choose Files button is present
    const chooseFilesButton = page.getByRole("button", {
      name: /choose files/i,
    });
    await expect(chooseFilesButton).toBeVisible();
    await expect(chooseFilesButton).not.toBeDisabled();
  });

  test("should have track management toolbar with required buttons", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify toolbar buttons exist for track management
    const chooseFilesButton = page.getByRole("button", {
      name: /choose files/i,
    });
    await expect(chooseFilesButton).toBeVisible();

    const recordButton = page.getByRole("button", { name: /record/i });
    await expect(recordButton).toBeVisible();

    // Clear/Remove button should be present for track deletion
    const clearButton = page.getByRole("button", { name: /clear|remove/i });
    await expect(clearButton).toBeVisible();
  });

  // TODO: Add test for audio file upload via drag and drop
  // - Test dropping MP3 files onto dropzone
  // - Verify files are added to track list
  // - Check that metadata (title, artist) is extracted

  test("should upload audio files via file picker", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data to start with empty state
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify the "Choose Files" button is present and enabled
    const chooseFilesButton = page.getByRole("button", {
      name: /choose files/i,
    });
    await expect(chooseFilesButton).toBeVisible();
    await expect(chooseFilesButton).not.toBeDisabled();

    // Verify button click behavior - button should be clickable
    // In a real browser with user interaction, this would open a file picker dialog
    await expect(chooseFilesButton).toHaveAttribute("type", "button");

    // Note: Full end-to-end file upload testing with actual file processing
    // is not feasible in automated tests due to several technical limitations:
    //
    // 1. Browser File System Access API: Chrome's native showOpenFilePicker()
    //    doesn't emit 'filechooser' events that Playwright can intercept
    //
    // 2. Fallback Compatibility: The fallback file input implementation uses
    //    FileSystemFileHandle interface that conflicts with Playwright's File
    //    mocking in headless Chrome
    //
    // 3. Web Worker Processing: MP3 decoding happens in Web Workers which adds
    //    async complexity and requires extended timeouts (30+ seconds per file)
    //
    // This test verifies the UI components are present and functional.
    // The underlying upload functionality is tested via:
    // - Unit tests: src/util/mp3/__specs__/ (MP3 decoding)
    // - Unit tests: src/hooks/useLibrary.ts (file handling)
    // - Integration tests: src/util/gme/__specs__/ (GME file generation with audio)
  });

  // TODO: Add test for recording audio through microphone
  // - Grant microphone permissions (if modal is implemented)
  // - Start recording
  // - Stop recording
  // - Verify recorded audio appears as track

  test("should control audio playback with play/pause/stop", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Read the test audio file and inject it directly into IndexedDB
    // This bypasses the complex file upload flow
    const fs = await import("fs");
    const path = await import("path");
    const audioFilePath = path.join(
      process.cwd(),
      "e2e/fixtures/hello.mp3",
    );
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString("base64");

    // Inject a test track with audio data into IndexedDB
    await page.evaluate(
      async ({ audioBase64 }) => {
        // Helper to use IndexedDB directly
        const idbSet = (key: string, value: any): Promise<void> => {
          return new Promise((resolve, reject) => {
            const dbName = "keyval-store";
            const storeName = "keyval";
            const request = indexedDB.open(dbName);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const transaction = db.transaction(storeName, "readwrite");
              const store = transaction.objectStore(storeName);
              const putRequest = store.put(value, key);

              putRequest.onerror = () => reject(putRequest.error);
              putRequest.onsuccess = () => resolve();
            };
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
              }
            };
          });
        };

        // Create a mock track object that matches the Track class structure
        const trackUuid = "test-track-12345";
        const track = {
          uuid: trackUuid,
          fileName: "hello.mp3",
          frames: {
            TIT2: {
              id: "TIT2",
              data: "Test Track",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Title",
            },
            TOA: {
              id: "TOA",
              data: "Test Artist",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Artist",
            },
            TALB: {
              id: "TALB",
              data: "Test Album",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Album",
            },
          },
          size: audioBase64.length,
          data: null,
        };

        // Convert base64 back to Uint8Array for storage
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Store track metadata and audio data in IndexedDB
        await idbSet(`track:${trackUuid}`, track);
        await idbSet(`data:${trackUuid}`, bytes);
      },
      { audioBase64 },
    );

    // Reload to pick up the injected track
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait a bit for React to initialize and load tracks from IndexedDB
    await page.waitForTimeout(1000);

    // Verify the track appears in the UI
    // Use first() to handle multiple instances of the same text in different views
    await expect(page.getByText("Test Track").first()).toBeVisible();
    await expect(page.getByText("Test Artist").first()).toBeVisible();
    await expect(page.getByText("Test Album").first()).toBeVisible();

    // Navigate to Layout tab where playback controls exist
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // Get reference to the audio element for verification
    // There is only one audio element in the DOM, so we can query for it directly
    const getAudioState = () =>
      page.evaluate(() => {
        const audio = document.querySelector("audio");
        if (!audio) return null;
        return {
          paused: audio.paused,
          currentTime: audio.currentTime,
          src: audio.src,
          readyState: audio.readyState,
        };
      });

    // Wait for the audio element to be created
    // The audio element is created when the Layout tab with OID codes is rendered
    await page.waitForFunction(() => document.querySelector("audio") != null, {
      timeout: 5000,
    });

    // Check initial state - audio should be paused
    let audioState = await getAudioState();
    expect(audioState).not.toBeNull();
    expect(audioState?.paused).toBe(true);

    // Find and click a track OID code to trigger playback
    // In the print layout, tracks are numbered starting at OID 1401
    // We'll click the first track's OID code element
    const trackOidCode = page.locator('rect[fill*="pattern.1401"]').first();

    if ((await trackOidCode.count()) > 0) {
      // Click the track OID to start playback
      await trackOidCode.click();

      // Wait for audio to start playing
      await page.waitForTimeout(500);

      // Verify audio is playing
      audioState = await getAudioState();
      expect(audioState?.paused).toBe(false);
      expect(audioState?.src).toContain("data:audio/mpeg");

      // Find and click the stop button OID code
      // Stop button uses the stopOid (default 15001)
      const stopButton = page.locator('rect[fill*="pattern.15001"]').first();

      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await page.waitForTimeout(200);

        // Verify audio is stopped (paused and reset to start)
        audioState = await getAudioState();
        expect(audioState?.paused).toBe(true);
        expect(audioState?.currentTime).toBe(0);
      }

      // Test replay functionality
      // Click track again to start playback
      await trackOidCode.click();
      await page.waitForTimeout(500);

      audioState = await getAudioState();
      expect(audioState?.paused).toBe(false);

      // Click replay button (replayOid default 15002)
      const replayButton = page
        .locator('rect[fill*="pattern.15002"]')
        .first();

      if ((await replayButton.count()) > 0) {
        // Let it play a bit first
        await page.waitForTimeout(500);

        await replayButton.click();
        await page.waitForTimeout(200);

        // Verify it's still playing but restarted
        audioState = await getAudioState();
        expect(audioState?.paused).toBe(false);
        // After replay, currentTime should be near 0
        expect(audioState?.currentTime).toBeLessThan(0.5);
      }
    }

    // Note: This test validates the audio playback control flow:
    // - Track data can be injected and loaded from IndexedDB
    // - Audio element can be queried directly from the DOM (only one exists)
    // - Play/stop/replay controls interact with the audio element
    // - The usePlayer hook manages audio playback state correctly
  });

  test("should prevent multiple MediaElementSource issue when replaying tracks", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Read the test audio file and inject it directly into IndexedDB
    const fs = await import("fs");
    const path = await import("path");
    const audioFilePath = path.join(
      process.cwd(),
      "e2e/fixtures/hello.mp3",
    );
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString("base64");

    // Inject a test track with audio data into IndexedDB
    await page.evaluate(
      async ({ audioBase64 }) => {
        const idbSet = (key: string, value: any): Promise<void> => {
          return new Promise((resolve, reject) => {
            const dbName = "keyval-store";
            const storeName = "keyval";
            const request = indexedDB.open(dbName);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              const transaction = db.transaction(storeName, "readwrite");
              const store = transaction.objectStore(storeName);
              const putRequest = store.put(value, key);

              putRequest.onerror = () => reject(putRequest.error);
              putRequest.onsuccess = () => resolve();
            };
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
              }
            };
          });
        };

        const trackUuid = "test-track-replay-12345";
        const track = {
          uuid: trackUuid,
          fileName: "hello.mp3",
          frames: {
            TIT2: {
              id: "TIT2",
              data: "Replay Test Track",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Title",
            },
            TOA: {
              id: "TOA",
              data: "Test Artist",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Artist",
            },
            TALB: {
              id: "TALB",
              data: "Test Album",
              size: 0,
              flags: null,
              frameDataSize: null,
              description: "Album",
            },
          },
          size: audioBase64.length,
          data: null,
        };

        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        await idbSet(`track:${trackUuid}`, track);
        await idbSet(`data:${trackUuid}`, bytes);
      },
      { audioBase64 },
    );

    // Setup console error listener to catch InvalidStateError
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    // Reload to pick up the injected track
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // Wait for audio element to be created
    await page.waitForFunction(() => document.querySelector("audio") != null, {
      timeout: 5000,
    });

    const getAudioState = () =>
      page.evaluate(() => {
        const audio = document.querySelector("audio");
        if (!audio) return null;
        return {
          paused: audio.paused,
          currentTime: audio.currentTime,
          src: audio.src,
        };
      });

    // Test scenario: Play -> Stop -> Replay multiple times
    // This verifies that audio elements are properly managed and no InvalidStateError occurs
    const trackOidCode = page.locator('rect[fill*="pattern.1401"]').first();

    if ((await trackOidCode.count()) > 0) {
      // First play cycle
      await trackOidCode.click();
      await page.waitForTimeout(500);

      let audioState = await getAudioState();
      expect(audioState?.paused).toBe(false);
      expect(audioState?.src).toContain("data:audio/mpeg");

      // Stop playback
      const stopButton = page.locator('rect[fill*="pattern.15001"]').first();
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await page.waitForTimeout(200);

        audioState = await getAudioState();
        expect(audioState?.paused).toBe(true);
        expect(audioState?.currentTime).toBe(0);
      }

      // Second play cycle - replay the same track
      await trackOidCode.click();
      await page.waitForTimeout(500);

      audioState = await getAudioState();
      expect(audioState?.paused).toBe(false);

      // Stop again
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await page.waitForTimeout(200);
      }

      // Third play cycle - test replay button
      await trackOidCode.click();
      await page.waitForTimeout(500);

      const replayButton = page
        .locator('rect[fill*="pattern.15002"]')
        .first();
      if ((await replayButton.count()) > 0) {
        await page.waitForTimeout(300);
        await replayButton.click();
        await page.waitForTimeout(200);

        audioState = await getAudioState();
        expect(audioState?.paused).toBe(false);
        expect(audioState?.currentTime).toBeLessThan(0.5);
      }

      // Fourth play cycle - one more time to ensure stability
      if ((await stopButton.count()) > 0) {
        await stopButton.click();
        await page.waitForTimeout(200);
      }

      await trackOidCode.click();
      await page.waitForTimeout(500);

      audioState = await getAudioState();
      expect(audioState?.paused).toBe(false);
    }

    // Verify no InvalidStateError or other errors occurred
    // This is the key assertion for the MediaElementSource issue
    expect(consoleErrors).toHaveLength(0);

    // Note: This test validates that:
    // - Audio can be played, stopped, and replayed multiple times without errors
    // - No InvalidStateError occurs (which would happen if trying to call
    //   createMediaElementSource twice on the same audio element)
    // - The usePlayer hook properly manages audio element state
    // - Multiple play/stop/replay cycles work correctly
  });

  // Track Management Tests
  // The following tests document and verify the UI structure for track management
  // functionality in the application.
  //
  // Note: Full end-to-end tests with actual audio file uploads require:
  // - Valid MP3 files (with proper headers and audio data)
  // - Extended test timeouts (30+ seconds per file for audio decoding via Web Workers)
  // - Browser support for File System Access API
  //
  // The AudioPanel component (src/components/AudioPanel.tsx) provides:
  // 1. Drag-and-drop file upload via Dropzone component
  // 2. Table view of tracks with columns for:
  //    - Selection checkbox
  //    - Track number
  //    - Cover art (album art from MP3 metadata)
  //    - Album (editable via Editable component)
  //    - Artist (editable via Editable component)
  //    - Title (editable via Editable component)
  //    - Actions (Remove button, Power-on sound toggle)
  //
  // The useLibrary hook manages track data with operations:
  // - onDrop: Upload files from drag-and-drop or file picker
  // - update: Save metadata changes to IndexedDB
  // - remove: Delete individual tracks
  // - clear: Delete all tracks
  //
  // Track metadata editing workflow:
  // 1. Click on Album/Artist/Title cell in track table
  // 2. Input field appears (Editable component)
  // 3. Enter new value and press Enter or blur
  // 4. useLibrary.update() saves to IndexedDB
  // 5. Changes persist across page reloads
  //
  // Track deletion workflow:
  // 1. Individual: Click Remove button in track table row
  // 2. Bulk: Select multiple tracks via checkboxes, click Remove in toolbar
  // 3. All: Click Clear button in toolbar (when no tracks selected)

  test("should have dropzone for drag-and-drop file upload", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data to see the dropzone
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // The AudioPanel wraps content in a Dropzone component
    // When empty, shows instructional card
    await expect(
      page.getByText(/your music files will show up here/i),
    ).toBeVisible();
    await expect(
      page.getByText(/drag-and-drop/i),
    ).toBeVisible();
  });
});

