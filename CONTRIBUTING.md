# Contributing to Totem

## Development Setup

This project uses [Bun](https://bun.sh) as its package manager and runtime for optimal performance.

### Prerequisites

- [Bun](https://bun.sh) v1.2 or later
- Node.js v20 or later (for compatibility with some tools)

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

# Run tests
bun run test

# Run tests in watch mode with UI
bun run test:dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Architecture

### Technology Stack

- **Bundler**: Vite 6.x (with Bun as package manager)
- **Framework**: React 19
- **UI Library**: Mantine 7.x
- **TypeScript**: 5.7.x
- **Testing**: Vitest 2.x
- **Linting**: ESLint 9.x + Prettier 3.x

### Workers

The project uses Web Workers for computationally intensive tasks:
- `gme.worker.ts` - GME file building
- `decoder.worker.ts` - MP3 decoding

Workers are imported using Vite's `?worker` suffix:
```typescript
import Worker from './worker?worker'
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

## Testing

Tests use Vitest with jsdom for React component testing. The test suite includes:
- Component tests using `@testing-library/react`
- GME file generation validation using the `tttool` binary

## Building for Production

```bash
bun run build
```

The build output will be in the `dist/` directory, ready for deployment as a static site.
