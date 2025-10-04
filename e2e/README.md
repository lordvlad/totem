# End-to-End Tests

This directory contains Playwright-based end-to-end tests for the Totem application.

## Test Structure

- **app.spec.ts** - Basic application tests

  - Application loading and initialization
  - Header and footer rendering
  - Basic navigation

- **oid-codes.spec.ts** - OID code generation tests

  - SVG pattern generation
  - Print layout functionality
  - OID code rendering at 1200 DPI

- **audio.spec.ts** - Audio handling tests
  - File upload (MP3/OGG)
  - Audio recording via microphone
  - Playback controls
  - Track management

## Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode for debugging
bun run test:e2e:ui

# Run in debug mode (step through tests)
bun run test:e2e:debug

# Run specific test file
bunx playwright test e2e/app.spec.ts

# Run tests in headed mode (see the browser)
bunx playwright test --headed
```

## Writing New Tests

1. Create a new `.spec.ts` file in this directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Use `test.describe()` to group related tests
4. Use `test()` for individual test cases
5. Use `await page.goto("/")` to navigate to the app
6. Use Playwright selectors to interact with elements

## Test Guidelines

- **Focus on user workflows**: Test complete user journeys, not individual components
- **Use semantic selectors**: Prefer role-based selectors (e.g., `page.getByRole('button', { name: 'Save' })`)
- **Wait for actions**: Use Playwright's auto-waiting features
- **Keep tests independent**: Each test should be able to run in isolation
- **Add TODO comments**: Document future test opportunities as inline comments

## Future Test Opportunities

The existing test files contain extensive TODO comments marking opportunities for:

- File upload workflows
- Audio recording and playback
- GME file generation and download
- Print layout configuration
- Locale and theme switching
- Multi-track audio management
- OID code generation and validation

## CI Integration

These tests run automatically in GitHub Actions on every push. The workflow:

1. Installs Playwright browsers
2. Starts the dev server (`bun run dev`)
3. Runs all E2E tests
4. Uploads test reports as artifacts (available for 30 days)

View test reports in GitHub Actions:

- Go to Actions tab → Select workflow run → Download "playwright-report" artifact
