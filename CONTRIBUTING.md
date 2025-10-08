# Contributing to Totem

## Development Setup

This project uses [Bun](https://bun.sh) as its package manager and runtime for optimal performance.

### Prerequisites

- [Bun](https://bun.sh) v1.2 or later
- Node.js v22 or later (required for Promise.withResolvers support)

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
```

### Development

```bash
# Start development server with hot reload
bun run dev

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run E2E tests in UI mode
bun run test:e2e:ui

# Run E2E tests in debug mode
bun run test:e2e:debug

# Build for production
bun run build

# Preview production build
bun run preview
```

## Architecture

### Technology Stack

- **Bundler**: Vite 6.x (with Bun as package manager)
- **Framework**: React 19
- **UI Library**: Mantine 8.x
- **TypeScript**: 5.7.x
- **Testing**: Bun's native test runner (unit tests) + Playwright (E2E tests)
- **Linting**: ESLint 9.x + Prettier 3.x

### Workers

The project uses Web Workers for computationally intensive tasks:

- `gme.worker.ts` - GME file building
- `decoder.worker.ts` - MP3 decoding

Workers are imported using Vite's `?worker` suffix:

```typescript
import Worker from "./worker?worker";
```

### Markdown Support

Markdown files are processed using `vite-plugin-markdown` and rendered with `react-markdown`:

```typescript
import { markdown as content } from './README.md'
<Markdown>{content}</Markdown>
```

## Code Style

- Follow the ESLint configuration (based on `eslint-config-love`)
- Use Prettier for formatting
- TypeScript strict mode is enabled
- All code must pass type checking, linting, and tests before submission

### Icons

When adding new icon components, use the [Lucide icon collection](https://icones.js.org/collection/lucide) as the source. Each icon component should include a comment referencing its source URL:

```typescript
// https://icones.js.org/collection/lucide?s=icon-name
export default function IconName(props: SVGProps<SVGSVGElement>) {
  // ... icon SVG
}
```

## Testing

The project uses two types of testing:

### Unit Tests (Bun Test Runner)

Unit tests use Bun's native test runner with jsdom for React component testing:

- Component tests using `@testing-library/react`
- GME file generation validation using the `tttool` binary

Test files use the `bun:test` module for test utilities:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
```

The jsdom environment is set up globally via `bunfig.toml` and `test-setup.ts` for DOM testing.

Run unit tests with:

```bash
bun run test
```

### End-to-End Tests (Playwright)

E2E tests use Playwright to test the application in a real browser environment:

- Full application workflow testing
- User interaction testing
- Visual regression testing capabilities

E2E test files are located in the `e2e/` directory and use Playwright's test runner:

```typescript
import { test, expect } from "@playwright/test";
```

#### Test Structure

- **app.spec.ts** - Basic application tests
  - Application loading and initialization
  - Header and footer rendering
  - Basic navigation
  - Theme switching (light/dark/auto mode)
  - Theme persistence across page reloads

- **oid-codes.spec.ts** - OID code generation tests
  - SVG pattern generation
  - Print layout functionality
  - OID code rendering at 1200 DPI

- **audio.spec.ts** - Audio handling tests
  - File upload (MP3/OGG)
  - Audio recording via microphone
  - Playback controls
  - Track management

#### Running Tests

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

**Note:** Playwright will automatically start the dev server (`bun run dev`) before running tests and shut it down after. On first run, you may need to install Playwright browsers:

```bash
bunx playwright install chromium
```

#### Writing New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Use `test.describe()` to group related tests
4. Use `test()` for individual test cases
5. Use `await page.goto("/")` to navigate to the app
6. Use Playwright selectors to interact with elements

#### Test Guidelines

- **Focus on user workflows**: Test complete user journeys, not individual components
- **Use semantic selectors**: Prefer role-based selectors (e.g., `page.getByRole('button', { name: 'Save' })`)
- **Wait for actions**: Use Playwright's auto-waiting features
- **Keep tests independent**: Each test should be able to run in isolation
- **Add TODO comments**: Document future test opportunities as inline comments
- **NO MOCKING**: E2E tests should never mock browser APIs, functions, or modules. This defeats the purpose of end-to-end testing.
  - ❌ Don't mock: `getUserMedia`, `fetch`, `localStorage`, `AudioContext`, etc.
  - ✅ Do use: Real browser APIs, fixture data, pre-populated test databases
  - If functionality requires mocking to test, it belongs in unit tests, not E2E tests
  - E2E tests validate the entire stack working together in a real browser environment

#### Future Test Opportunities

The existing test files contain extensive TODO comments marking opportunities for:
- File upload workflows
- Audio recording and playback
- GME file generation and download
- Print layout configuration
- Locale and theme switching
- Multi-track audio management
- OID code generation and validation

#### CI Integration

These tests run automatically in GitHub Actions on every push. The workflow:
1. Caches Bun dependencies for faster installation
2. Builds the production version of the app
3. Caches Playwright browsers to avoid re-downloading
4. Installs Playwright browsers (chromium-headless-shell only for speed)
5. Starts a preview server with the pre-built app
6. Runs all E2E tests
7. Uploads test reports as artifacts (available for 30 days)

The CI environment uses a production build (`bun run preview`) instead of the dev server for faster startup times. It also installs only `chromium-headless-shell` without system dependencies (`--with-deps`) since ubuntu-latest runners already have the required libraries. This significantly speeds up the browser installation step. Local development still uses the dev server (`bun run dev`).

View test reports in GitHub Actions:
- Go to Actions tab → Select workflow run → Download "playwright-report" artifact

## Building for Production

```bash
bun run build
```

The build output will be in the `dist/` directory, ready for deployment as a static site.
