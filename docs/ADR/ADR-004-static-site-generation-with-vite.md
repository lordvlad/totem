# ADR-004: Static Site Generation with Vite

## Status

Accepted

## Context

Totem needs a build system that can:
- Bundle a React application efficiently
- Handle TypeScript compilation
- Support Web Workers with proper imports
- Process markdown files for documentation
- Generate a static site that can be deployed anywhere
- Provide fast development experience with HMR (Hot Module Replacement)

## Decision

Use Vite 6.x as the build tool and bundler to generate a static site deployed to GitHub Pages.

**Key Configuration (`vite.config.mjs`):**
```javascript
{
  base: './',  // Relative paths for deployment flexibility
  plugins: [
    react(),
    checker({ typescript: true }),
    markdown({ mode: [Mode.MARKDOWN] }),
  ],
  worker: {
    format: 'es',  // ES module format for workers
  },
}
```

## Rationale

1. **Fast Development**: Vite's dev server with HMR provides instant feedback
2. **Modern Bundling**: Uses esbuild for fast builds (typically 7 seconds)
3. **Native ES Modules**: Leverages native browser module support
4. **Worker Support**: First-class support for Web Workers via `?worker` suffix
5. **Static Output**: Generates pure static files (HTML, JS, CSS) for `dist/` directory
6. **Zero Config**: Works well out of the box with minimal configuration
7. **Plugin Ecosystem**: Rich plugin system (TypeScript checker, markdown processing)

## Consequences

### Positive
- Development server starts in seconds
- Hot Module Replacement for instant updates during development
- Optimized production builds with code splitting
- Static output can be deployed to any static hosting (GitHub Pages, Netlify, S3)
- No server required for deployment
- TypeScript checking integrated into build process
- Markdown files can be imported as modules

### Negative
- Build output has large chunks (>500KB warning is expected)
- Relative path configuration (`base: './'`) required for subdirectory deployment
- Some optimizations (like bundle size splitting) may need manual configuration
- Legacy browser support requires additional configuration

## Implementation Details

### Build Pipeline
1. **Development**: `bun run dev` - Starts Vite dev server on port 5173
2. **Production**: `bun run build` - Generates static files in `dist/`
3. **Preview**: `bun run preview` - Serves production build locally

### CI/CD Integration
GitHub Actions workflow:
```yaml
- bun install
- VITE_GIT_HASH=${GITHUB_SHA::6} bun run build
- Deploy dist/ to GitHub Pages
```

### Special Imports
- **Workers**: `import Worker from './file?worker'`
- **Markdown**: `import { markdown as content } from './README.md'`

### Base Path Configuration
`base: './'` ensures the app works when deployed to:
- Root domain: `https://example.com/`
- Subdirectory: `https://example.com/totem/`
- GitHub Pages: `https://lordvlad.github.io/totem/`

## Notes

The large chunk size warning (>500KB) is **expected and acceptable** for this application because:
- All processing happens client-side, requiring significant bundled code
- GME encoding logic is complex and cannot be easily split
- No network requests for functionality means larger initial bundle

Do not attempt to fix the chunk size warning unless it significantly impacts performance.
