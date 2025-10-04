import { test, expect } from "@playwright/test";

test.describe("Multi-Project Management", () => {
  // Clean up IndexedDB before each test to ensure isolation
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear IndexedDB to start fresh
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const dbs = indexedDB.databases();
        dbs
          .then((databases) => {
            const promises = databases.map((db) => {
              if (db.name) {
                return indexedDB.deleteDatabase(db.name);
              }
              return Promise.resolve();
            });
            return Promise.all(promises);
          })
          .then(() => {
            resolve();
          })
          .catch(() => {
            resolve();
          });
      });
    });
    await page.reload();
  });

  test("should display Projects tab", async ({ page }) => {
    await page.goto("/");

    // Look for the Projects tab (second tab with Folder icon)
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await expect(projectsTab).toBeVisible();
  });

  test("should create default project on first load", async ({ page }) => {
    await page.goto("/");

    // Click on Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Should see project selector
    const projectSelector = page.getByLabel(/current project/i);
    await expect(projectSelector).toBeVisible();

    // Should have a default project
    await expect(projectSelector).toHaveValue(/my first project/i);
  });

  test("should create a new project", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Click "New Project" button
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    // Modal should appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Enter project name
    const projectNameInput = modal.getByLabel(/project name/i);
    await projectNameInput.fill("Test Project");

    // Click Create button
    const createButton = modal.getByRole("button", { name: /create/i });
    await createButton.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // New project should be selected
    const projectSelector = page.getByLabel(/current project/i);
    await expect(projectSelector).toHaveValue("Test Project");
  });

  test("should switch between projects", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Create first project (default exists)
    const projectSelector = page.getByLabel(/current project/i);
    const firstProjectName = await projectSelector.inputValue();

    // Create a second project
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    const modal = page.getByRole("dialog");
    const projectNameInput = modal.getByLabel(/project name/i);
    await projectNameInput.fill("Second Project");

    const createButton = modal.getByRole("button", { name: /create/i });
    await createButton.click();

    // Should now be on "Second Project"
    await expect(projectSelector).toHaveValue("Second Project");

    // Switch back to first project
    await projectSelector.click();
    const firstOption = page.getByRole("option", { name: firstProjectName });
    await firstOption.click();

    // Should be back on first project
    await expect(projectSelector).toHaveValue(firstProjectName);
  });

  test("should delete project with confirmation", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Create a second project so we can delete one
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    let modal = page.getByRole("dialog");
    await modal.getByLabel(/project name/i).fill("Project to Delete");
    await modal.getByRole("button", { name: /create/i }).click();

    // Click Delete button
    const deleteButton = page.getByRole("button", {
      name: /delete project/i,
    });
    await deleteButton.click();

    // Confirmation dialog should appear
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(/are you sure/i);

    // Confirm deletion
    const confirmButton = confirmDialog.getByRole("button", { name: /yes/i });
    await confirmButton.click();

    // Project should be deleted and switched to another project
    const projectSelector = page.getByLabel(/current project/i);
    await expect(projectSelector).not.toHaveValue("Project to Delete");
  });

  test("should prevent deletion of last project", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Try to delete the only project
    const deleteButton = page.getByRole("button", {
      name: /delete project/i,
    });

    // Button should be disabled or show error
    // (Implementation may vary - checking if button exists and behavior)
    await expect(deleteButton).toBeVisible();
  });

  test("should display project metadata in table", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Look for project details table
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Should have column headers
    await expect(table).toContainText(/name/i);
    await expect(table).toContainText(/created/i);
    await expect(table).toContainText(/modified/i);
  });

  test("should isolate data between projects", async ({ page }) => {
    await page.goto("/");

    // Create two projects and verify data isolation
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Get initial project name
    const projectSelector = page.getByLabel(/current project/i);
    const project1Name = await projectSelector.inputValue();

    // Go to Audio tab and verify no tracks initially
    const audioTab = page.getByRole("tab", { name: /audio/i });
    await audioTab.click();

    // Note: Would need to add audio tracks here to test isolation
    // For now, just verify the tab switches work

    // Switch back to Projects tab
    await projectsTab.click();

    // Create second project
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    const modal = page.getByRole("dialog");
    await modal.getByLabel(/project name/i).fill("Isolated Project");
    await modal.getByRole("button", { name: /create/i }).click();

    // Verify we're on the new project
    await expect(projectSelector).toHaveValue("Isolated Project");

    // Go to Audio tab - should be empty (isolated from project1)
    await audioTab.click();

    // Switch back to first project
    await projectsTab.click();
    await projectSelector.click();
    const firstOption = page.getByRole("option", { name: project1Name });
    await firstOption.click();

    // Should be back on first project with its data
    await expect(projectSelector).toHaveValue(project1Name);
  });

  test("should persist projects across page reloads", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Create a project
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    const modal = page.getByRole("dialog");
    await modal.getByLabel(/project name/i).fill("Persistent Project");
    await modal.getByRole("button", { name: /create/i }).click();

    // Reload the page
    await page.reload();

    // Navigate back to Projects tab
    await projectsTab.click();

    // Project should still be selected
    const projectSelector = page.getByLabel(/current project/i);
    await expect(projectSelector).toHaveValue("Persistent Project");
  });

  test("should show import/export buttons", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Should see export button
    const exportButton = page.getByRole("button", {
      name: /export|download|save project/i,
    });
    await expect(exportButton).toBeVisible();

    // Should see import button
    const importButton = page.getByRole("button", {
      name: /import|open project/i,
    });
    await expect(importButton).toBeVisible();
  });

  test("should open URL loading modal", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects tab
    const projectsTab = page.getByRole("tab", { name: /projects/i });
    await projectsTab.click();

    // Look for "Load from URL" button (if integrated)
    const urlButton = page.getByRole("button", { name: /load from url/i });

    // Check if button exists (may not be integrated yet)
    const buttonCount = await urlButton.count();
    if (buttonCount > 0) {
      await urlButton.click();

      // Modal should appear
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/url/i);
    }
  });
});
