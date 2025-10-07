import { test, expect, devices } from "@playwright/test";

test.describe("Mobile Print Preview", () => {
  test("should show print preview inline on desktop screens", async ({
    page,
  }) => {
    // Set viewport to desktop size (wider than 750px)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // On desktop, the print preview should be visible inline
    // Check for the print preview container (white box with paper dimensions)
    const printPreview = page.locator('div[style*="background"]').filter({
      hasText: /.*/,
    });

    // The print preview should be directly visible (not behind a FAB)
    const previewCount = await printPreview.count();
    expect(previewCount).toBeGreaterThan(0);

    // FAB should not be visible on desktop
    const fab = page.getByRole("button", { name: /toggle print preview/i });
    await expect(fab).not.toBeVisible();
  });

  test("should hide print preview behind FAB on mobile screens", async ({
    page,
  }) => {
    // Set viewport to mobile size (narrower than 750px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // On mobile, the FAB should be visible
    const fab = page.getByRole("button", { name: /toggle print preview/i });
    await expect(fab).toBeVisible();

    // Drawer should not be visible initially
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).not.toBeVisible();
  });

  test("should toggle print preview when FAB is clicked on mobile", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // Click the FAB to show preview
    const fab = page.getByRole("button", { name: /toggle print preview/i });
    await expect(fab).toBeVisible();
    await fab.click();
    await page.waitForTimeout(300);

    // Drawer should now be visible
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Click close button to close drawer
    const closeButton = page.getByRole("button", { name: /close/i }).first();
    await closeButton.click();
    await page.waitForTimeout(300);

    // Drawer should be hidden again
    await expect(drawer).not.toBeVisible();
  });

  test("should maintain preview visibility when switching between tabs on mobile", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // FAB should be visible on tiles layout
    const fab = page.getByRole("button", { name: /toggle print preview/i });
    await expect(fab).toBeVisible();

    // Switch to table layout
    const tableLayoutTab = page
      .getByRole("tab", { name: /table/i })
      .filter({ has: page.locator("svg") });
    await tableLayoutTab.click();
    await page.waitForTimeout(500);

    // FAB should still be visible on table layout
    await expect(fab).toBeVisible();
  });

  test("should respond to screen size changes", async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);

    // FAB should not be visible on desktop
    const fab = page.getByRole("button", { name: /toggle print preview/i });
    await expect(fab).not.toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // FAB should now be visible
    await expect(fab).toBeVisible();

    // Resize back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    // FAB should be hidden again
    await expect(fab).not.toBeVisible();
  });

  test("should only show FAB on Layout tab, not other tabs", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const fab = page.getByRole("button", { name: /toggle print preview/i });

    // Check FAB is not visible on Audio tab
    const audioTab = page.getByRole("tab", { name: /^audio$/i });
    await expect(audioTab).toBeVisible();
    await audioTab.click();
    await page.waitForTimeout(500);
    await expect(fab).not.toBeVisible();

    // Check FAB is not visible on Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await expect(projectsTab).toBeVisible();
    await projectsTab.click();
    await page.waitForTimeout(500);
    await expect(fab).not.toBeVisible();

    // Check FAB is not visible on Settings tab
    const settingsTab = page.getByRole("tab", { name: /settings/i });
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();
    await page.waitForTimeout(500);
    await expect(fab).not.toBeVisible();

    // Check FAB IS visible on Layout tab
    const layoutTab = page.getByRole("tab", { name: /layout/i });
    await expect(layoutTab).toBeVisible();
    await layoutTab.click();
    await page.waitForTimeout(500);
    await expect(fab).toBeVisible();

    // Check FAB is not visible on Downloads tab
    const downloadsTab = page.getByRole("tab", { name: /downloads/i });
    await expect(downloadsTab).toBeVisible();
    await downloadsTab.click();
    await page.waitForTimeout(500);
    await expect(fab).not.toBeVisible();
  });
});
