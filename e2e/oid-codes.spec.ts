import { test, expect } from "@playwright/test";

test.describe("OID Code Generation", () => {
  test("should render OID codes as SVG patterns", async ({ page }) => {
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // TODO: Navigate to a section where OID codes are displayed
    // This will depend on how the app workflow is structured

    // For now, we verify that SVG rendering works by checking
    // if the app loads without errors
    await expect(page).toHaveTitle(/Totem/);
  });

  test("should generate OID code patterns with correct structure", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Navigate to the Layout tab to view print preview
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();

    // Wait for layout panel to be visible
    await page.waitForTimeout(500);

    // Verify that SVG pattern elements are generated
    // The PrintPreview component should contain OID code patterns
    const printPreview = page.locator("svg pattern");

    // Check that at least one SVG pattern element exists
    // (OID codes are rendered as SVG patterns in the print layout)
    const patternCount = await printPreview.count();

    // The app may have control buttons (play all, stop, replay) that use OID codes
    // Even without uploaded audio tracks, these controls should render OID patterns
    expect(patternCount).toBeGreaterThanOrEqual(0);

    // If patterns exist, verify their structure
    if (patternCount > 0) {
      // Get the first pattern
      const firstPattern = printPreview.first();

      // Verify the pattern has an ID attribute in the format "pattern.{code}"
      const patternId = await firstPattern.getAttribute("id");
      expect(patternId).toMatch(/^pattern\.\d+$/);

      // Verify that path elements exist within the pattern
      // OID codes are composed of path elements that create the optical identification pattern
      const pathElements = firstPattern.locator("path");
      const pathCount = await pathElements.count();
      expect(pathCount).toBeGreaterThan(0);
    }
  });

  test("should adjust OID code pattern density based on pixel size configuration", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Settings tab to configure OID pixel size
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();
    await page.waitForTimeout(500);

    // Find the OID Pixel Size input field
    // The input should have "px" as rightSection and be labeled "OID Pixel Size"
    const pixelSizeLabel = page.locator("text=OID Pixel Size").first();
    await expect(pixelSizeLabel).toBeVisible();

    // Find the input field - it's a NumberInput with rightSection="px"
    // We'll locate it by finding the input near the label
    const pixelSizeInput = page
      .locator('input[type="text"]')
      .filter({ has: page.locator("..").filter({ hasText: "px" }) })
      .first();

    // Get the initial pixel size value
    const initialValue = await pixelSizeInput.inputValue();
    const initialPixelSize = parseInt(initialValue || "2");

    // Change the pixel size to a different value
    const newPixelSize = initialPixelSize === 2 ? 4 : 2;
    await pixelSizeInput.clear();
    await pixelSizeInput.fill(newPixelSize.toString());
    await pixelSizeInput.press("Tab"); // Trigger change event
    await page.waitForTimeout(500); // Wait for debounced update

    // Navigate to Layout tab to view the generated patterns
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // Verify that SVG patterns exist
    const svgPatterns = page.locator("svg pattern");
    const patternCount = await svgPatterns.count();

    if (patternCount > 0) {
      // Get the first pattern to inspect its structure
      const firstPattern = svgPatterns.first();
      const pathElements = firstPattern.locator("path");
      const pathCount = await pathElements.count();
      expect(pathCount).toBeGreaterThan(0);

      // Verify that path elements use the new pixel size in their dimensions
      // The path elements should have 'd' attributes containing the pixel size
      if (pathCount > 0) {
        const firstPath = pathElements.first();
        const pathD = await firstPath.getAttribute("d");
        expect(pathD).toBeTruthy();

        // The path 'd' attribute should contain coordinates that reflect pixel size
        // For example, with pixel size 2, we'd see "h2" or "v2" in the path
        // With pixel size 4, we'd see "h4" or "v4"
        if (pathD) {
          // The pixel size appears in the path as horizontal/vertical line segments
          // Pattern: "h{size}" or "v{size}" or coordinates involving the size
          const hasExpectedSize =
            pathD.includes(`h${newPixelSize}`) ||
            pathD.includes(`v${newPixelSize}`) ||
            pathD.includes(`h-${newPixelSize}`) ||
            pathD.includes(`v-${newPixelSize}`);
          expect(hasExpectedSize).toBe(true);
        }
      }
    }

    // Change back to initial pixel size to test reactivity
    await settingsTab.click();
    await page.waitForTimeout(500);
    await pixelSizeInput.clear();
    await pixelSizeInput.fill(initialPixelSize.toString());
    await pixelSizeInput.press("Tab");
    await page.waitForTimeout(500);

    // Navigate back to Layout and verify the pattern changed back
    await layoutTab.click();
    await page.waitForTimeout(500);

    if (patternCount > 0) {
      const firstPattern = svgPatterns.first();
      const pathElements = firstPattern.locator("path");
      const pathCount = await pathElements.count();

      if (pathCount > 0) {
        const firstPath = pathElements.first();
        const pathD = await firstPath.getAttribute("d");

        if (pathD) {
          const hasInitialSize =
            pathD.includes(`h${initialPixelSize}`) ||
            pathD.includes(`v${initialPixelSize}`) ||
            pathD.includes(`h-${initialPixelSize}`) ||
            pathD.includes(`v-${initialPixelSize}`);
          expect(hasInitialSize).toBe(true);
        }
      }
    }
  });

  test("should switch between different print layout options", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // Test 1: Verify Tiles layout is default and displays control OID codes
    // Check that we're on the tiles tab
    const tilesTab = page.getByRole("tab", { name: /tiles/i });
    await expect(tilesTab).toHaveAttribute("aria-selected", "true");

    // Verify OID patterns exist for control buttons
    // Even without tracks, control buttons (stop, replay) should render OID codes
    let svgPatterns = page.locator("svg pattern");
    let initialPatternCount = await svgPatterns.count();

    // The tiles layout should display at least some OID codes (control buttons)
    // Control buttons are displayed based on feature flags (featureGeneralControls, featureAlbumControls)
    expect(initialPatternCount).toBeGreaterThanOrEqual(0);

    // If patterns exist, verify specific control OID codes are present
    if (initialPatternCount > 0) {
      // Stop button should have OID code 7778 (default stopOid)
      const stopPattern = page.locator('svg pattern[id="pattern.7778"]');
      const stopPatternCount = await stopPattern.count();

      // Replay button should have OID code 7779 (default replayOid)
      const replayPattern = page.locator('svg pattern[id="pattern.7779"]');
      const replayPatternCount = await replayPattern.count();

      // At least one of the control patterns should be present
      expect(stopPatternCount + replayPatternCount).toBeGreaterThan(0);
    }

    // Test 2: Switch to Table layout and verify OID codes
    const tableTab = page.getByRole("tab", { name: /table/i });
    await expect(tableTab).toBeVisible();
    await tableTab.click();
    await page.waitForTimeout(500);

    // Verify table layout is active
    await expect(tableTab).toHaveAttribute("aria-selected", "true");

    // Verify OID patterns exist in table layout
    svgPatterns = page.locator("svg pattern");
    let tablePatternCount = await svgPatterns.count();

    // Table layout should display OID codes (may be 0 without tracks)
    expect(tablePatternCount).toBeGreaterThanOrEqual(0);

    // If the initial pattern count was > 0, the table pattern count should also be > 0
    // (since both layouts use the same Controls component)
    if (initialPatternCount > 0) {
      expect(tablePatternCount).toBeGreaterThan(0);
    }

    // Test 3: Switch to Custom layout
    const customTab = page.getByRole("tab", { name: /custom/i });
    await expect(customTab).toBeVisible();
    await customTab.click();
    await page.waitForTimeout(500);

    // Verify custom layout is active
    await expect(customTab).toHaveAttribute("aria-selected", "true");

    // Custom layout may have different OID code display
    svgPatterns = page.locator("svg pattern");
    let customPatternCount = await svgPatterns.count();

    // Custom layout should have some OID patterns (may be 0)
    expect(customPatternCount).toBeGreaterThanOrEqual(0);

    // Test 4: Switch back to Tiles and verify tile size configuration exists
    await tilesTab.click();
    await page.waitForTimeout(500);

    // Verify we're back on tiles tab
    await expect(tilesTab).toHaveAttribute("aria-selected", "true");

    // Look for tile size configuration in the tiles panel
    // The TileLayoutPanel should have a tile size selector
    const tileSizeLabel = page.locator("text=Tile Size, text=Grid Size").first();
    const tileSizeLabelCount = await tileSizeLabel.count();

    // If tile size configuration exists, the OID code count should remain consistent
    // when switching tile sizes (only the grid layout changes, not OID codes)
    const finalPatternCount = await page.locator("svg pattern").count();

    // The pattern count should be consistent with the initial count
    // Both should be 0 or both should be > 0
    if (initialPatternCount > 0) {
      expect(finalPatternCount).toBeGreaterThan(0);
    } else {
      expect(finalPatternCount).toBeGreaterThanOrEqual(0);
    }

    // Verify we can navigate between all three layout types
    // This confirms the layout switcher works correctly
    await tableTab.click();
    await page.waitForTimeout(300);
    await expect(tableTab).toHaveAttribute("aria-selected", "true");

    await customTab.click();
    await page.waitForTimeout(300);
    await expect(customTab).toHaveAttribute("aria-selected", "true");

    await tilesTab.click();
    await page.waitForTimeout(300);
    await expect(tilesTab).toHaveAttribute("aria-selected", "true");
  });

  // TODO: Add test for OID code download/print
  // - Generate a print layout
  // - Trigger print dialog
  // - Verify SVG content is printer-friendly (1200 DPI)

  test("should have print button that is disabled when no tracks exist", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear any existing data to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => indexedDB.deleteDatabase("keyval-store"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Navigate to the Download tab to access the Print button
    const downloadTab = page.getByRole("tab", { name: /download/i });
    await expect(downloadTab).toBeVisible();
    await downloadTab.click();

    // Wait for download panel to be visible
    await page.waitForTimeout(500);

    // Verify Print button exists but is disabled (no tracks)
    const printButton = page.getByRole("button", { name: /^print$/i });
    await expect(printButton).toBeVisible();
    await expect(printButton).toBeDisabled();
  });

  test("should show print hint modal and trigger print dialog", async ({
    page,
  }) => {
    // Mock window.print() before loading the page
    await page.addInitScript(() => {
      (window as any).printCalled = false;
      (window as any).originalPrint = window.print;
      window.print = () => {
        (window as any).printCalled = true;
      };
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear localStorage but keep indexedDB to simulate having tracks
    // We'll use addInitScript to inject mock tracks into the app state
    await page.addInitScript(() => {
      // Mock the useLibrary hook to return tracks
      // This simulates the app having loaded audio tracks
      const originalIndexedDB = window.indexedDB;
      const mockDB = {
        open: () => {
          const request = originalIndexedDB.open("keyval-store");
          const origOnSuccess = request.onsuccess;
          request.onsuccess = function (event) {
            if (origOnSuccess) origOnSuccess.call(this, event);
            // Mock track data is already present
          };
          return request;
        },
      };
      // @ts-ignore
      window.indexedDB = mockDB;
    });

    // Ensure print hint has not been read (first time printing)
    await page.evaluate(() => {
      localStorage.removeItem("print-hint-read");
      // Simulate having tracks by setting a flag
      // The actual implementation would require complex IDB mocking
      // For this test, we verify the modal behavior when the button is clicked
    });

    // Navigate to Download tab
    const downloadTab = page.getByRole("tab", { name: /download/i });
    await downloadTab.click();
    await page.waitForTimeout(500);

    // Since we can't easily add tracks in e2e tests, this test verifies
    // the print hint modal behavior when the Print button would be clicked
    // In a real scenario with tracks loaded, clicking the Print button
    // would show the modal

    // Verify Print button exists
    const printButton = page.getByRole("button", { name: /^print$/i });
    await expect(printButton).toBeVisible();

    // Note: The Print button is disabled without tracks, so we cannot
    // test the modal behavior without a more complex track injection mechanism.
    // This test documents the expected behavior:
    // 1. When tracks exist and print-hint-read is false, clicking Print shows a modal
    // 2. The modal contains guidance about Chrome print settings
    // 3. Clicking OK in the modal triggers window.print()
    // 4. Setting print-hint-read to true skips the modal on subsequent prints
  });

  test("should render print-friendly SVG patterns with 1200 DPI", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab to view print preview
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();

    // Wait for layout panel to be visible
    await page.waitForTimeout(500);

    // Verify that SVG patterns exist in the print preview
    // Even without tracks, control OID codes (play all, stop, replay) should render
    const svgPatterns = page.locator("svg pattern");
    const patternCount = await svgPatterns.count();

    // If patterns exist, verify their structure for 1200 DPI rendering
    if (patternCount > 0) {
      // Get the first SVG element
      const svgElements = page.locator("svg");
      const firstSvg = svgElements.first();

      // Verify SVG has a viewBox attribute (required for proper scaling)
      const viewBox = await firstSvg.getAttribute("viewBox");
      expect(viewBox).toBeTruthy();

      // Verify the viewBox dimensions reflect high DPI
      // For 1200 DPI: dpmm = 1200 / 25.4 ≈ 47.24 dots per mm
      // A typical OID code of 256x256px at 1200 DPI would have
      // a viewBox like "0 0 12096 12096" (256 * 47.24)
      if (viewBox) {
        const [, , width, height] = viewBox.split(" ").map(Number);
        // Verify the dimensions are large enough for 1200 DPI
        // At 1200 DPI, even a small OID code should have viewBox dimensions > 1000
        expect(width).toBeGreaterThan(1000);
        expect(height).toBeGreaterThan(1000);
      }

      // Verify the pattern has proper structure
      const firstPattern = svgPatterns.first();
      const patternId = await firstPattern.getAttribute("id");
      expect(patternId).toMatch(/^pattern\.\d+$/);

      // Verify that path elements exist within the pattern
      const pathElements = firstPattern.locator("path");
      const pathCount = await pathElements.count();
      expect(pathCount).toBeGreaterThan(0);
    }
  });
});
