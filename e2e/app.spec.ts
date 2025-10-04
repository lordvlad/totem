import { test, expect } from "@playwright/test";

test.describe("Totem Application", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // Check that the page title contains "Totem"
    await expect(page).toHaveTitle(/Totem/);

    // Check that the main app container is visible
    const appContainer = page.locator("#app");
    await expect(appContainer).toBeVisible();
  });

  test("should display header and footer", async ({ page }) => {
    await page.goto("/");

    // Check for GitHub link in footer
    const githubLink = page.locator('a[href*="github.com/lordvlad/totem"]');
    await expect(githubLink).toBeVisible();

    // Check for issue tracker link
    const issueLink = page.locator(
      'a[href*="github.com/lordvlad/totem/issues"]',
    );
    await expect(issueLink).toBeVisible();
  });

  // TODO: Add test for audio file upload functionality
  // - Test uploading MP3/OGG files
  // - Verify audio tracks appear in the list
  // - Test track reordering/deletion

  // TODO: Add test for GME file generation
  // - Upload audio files
  // - Configure product ID and language
  // - Generate GME file
  // - Verify download triggers

  // TODO: Add test for OID code generation
  // - Generate OID codes for tracks
  // - Verify SVG patterns are created
  // - Test print layout configuration

  // TODO: Add test for locale switching
  // - Test switching between supported languages (de_DE, es_ES, fr_FR, it_IT)
  // - Verify UI text updates accordingly

  // TODO: Add test for theme switching
  // - Test light/dark theme toggle
  // - Verify theme persistence
});
