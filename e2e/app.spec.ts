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

    // Check for GitHub repository link in footer
    const githubLink = page.getByRole("link", {
      name: /check it out on github/i,
    });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "http://github.com/lordvlad/totem",
    );

    // Check for issue tracker link
    const issueLink = page.getByRole("link", { name: /file an issue/i });
    await expect(issueLink).toBeVisible();
    await expect(issueLink).toHaveAttribute(
      "href",
      "https://github.com/lordvlad/totem/issues",
    );
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

  test("should switch between light, dark, and auto themes", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Clear localStorage to start with a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Find the theme picker button by its test ID
    const themeButton = page.getByTestId("theme-picker-button");
    await expect(themeButton).toBeVisible();

    // Verify initial localStorage state (should default be `null`)
    let colorScheme = await page.evaluate(() =>
      localStorage.getItem("mantine-color-scheme-value"),
    );
    expect(colorScheme).toBe(null);

    // Click to switch to "light" theme
    await themeButton.click();

    // Verify theme changed in localStorage
    colorScheme = await page.evaluate(() =>
      localStorage.getItem("mantine-color-scheme-value"),
    );
    expect(colorScheme).toBe("light");

    // Click to switch to "dark" theme
    await themeButton.click();

    // Verify theme changed in localStorage
    colorScheme = await page.evaluate(() =>
      localStorage.getItem("mantine-color-scheme-value"),
    );
    expect(colorScheme).toBe("dark");

    // Click to switch back to "auto" theme
    await themeButton.click();

    // Verify theme changed in localStorage
    colorScheme = await page.evaluate(() =>
      localStorage.getItem("mantine-color-scheme-value"),
    );
    expect(colorScheme).toBe("auto");

    // Reload the page to verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify the theme is still "auto" after reload
    colorScheme = await page.evaluate(() =>
      localStorage.getItem("mantine-color-scheme-value"),
    );
    expect(colorScheme).toBe("auto");
  });
});
