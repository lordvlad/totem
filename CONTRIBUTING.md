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

Run E2E tests with:

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode for debugging
bun run test:e2e:ui

# Run in debug mode
bun run test:e2e:debug
```

**Note:** Playwright will automatically start the dev server (`bun run dev`) before running tests and shut it down after. On first run, you may need to install Playwright browsers:

```bash
bunx playwright install chromium
```

## Building for Production

```bash
bun run build
```

The build output will be in the `dist/` directory, ready for deployment as a static site.
