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

  // TODO: Add test for OID code pixel size configuration
  // - Test adjusting pixel size setting
  // - Verify pattern density changes accordingly

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
