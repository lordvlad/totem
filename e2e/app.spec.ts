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

  test("should switch between locales", async ({ page }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Clear localStorage to start with a clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Find the locale picker button by its test ID
    const localeButton = page.getByTestId("locale-picker-button");
    await expect(localeButton).toBeVisible();

    // Verify initial localStorage state (should default to en-US or browser locale)
    let lang = await page.evaluate(() => localStorage.getItem("lang"));
    // Initial state could be null (browser default) or a locale
    const initialLang = lang;

    // Get the Help button text to verify locale changes
    const helpButton = page.getByRole("button", { name: /help|hilfe|ayuda|aide|aiuto/i });
    await expect(helpButton).toBeVisible();

    // Click to open the locale picker menu
    await localeButton.click();

    // Click on German (Deutsch)
    await page.getByRole("menuitem", { name: "Deutsch" }).click();

    // Verify locale changed in localStorage
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("de-DE");

    // Verify UI text updated - Help button should now show "Hilfe"
    await expect(
      page.getByRole("button", { name: /hilfe/i }),
    ).toBeVisible();

    // Switch to Spanish
    await localeButton.click();
    await page.getByRole("menuitem", { name: "Español" }).click();

    // Verify locale changed
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("es-ES");

    // Verify UI text updated - Help button should show "Ayuda"
    await expect(
      page.getByRole("button", { name: /ayuda/i }),
    ).toBeVisible();

    // Switch to French
    await localeButton.click();
    await page.getByRole("menuitem", { name: "Français" }).click();

    // Verify locale changed
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("fr-FR");

    // Verify UI text updated - Help button should show "Aide"
    await expect(
      page.getByRole("button", { name: /aide/i }),
    ).toBeVisible();

    // Switch to Italian
    await localeButton.click();
    await page.getByRole("menuitem", { name: "Italiano" }).click();

    // Verify locale changed
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("it-IT");

    // Verify UI text updated - Help button should show "Aiuto"
    await expect(
      page.getByRole("button", { name: /aiuto/i }),
    ).toBeVisible();

    // Switch back to English
    await localeButton.click();
    await page.getByRole("menuitem", { name: "English" }).click();

    // Verify locale changed
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("en-US");

    // Verify UI text updated back to English
    await expect(
      page.getByRole("button", { name: /^help$/i }),
    ).toBeVisible();

    // Reload the page to verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify the locale is still "en-US" after reload
    lang = await page.evaluate(() => localStorage.getItem("lang"));
    expect(lang).toBe("en-US");

    // Verify Help button is still in English
    await expect(
      page.getByRole("button", { name: /^help$/i }),
    ).toBeVisible();
  });

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
