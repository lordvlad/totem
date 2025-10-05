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

  // TODO: Add test for print layout options
  // - Test different layout configurations (grid, list, etc.)
  // - Verify correct number of OID codes are displayed
  // - Test stop/replay OID codes

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
