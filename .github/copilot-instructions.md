# Totem - Copilot Developer Instructions

## Project Overview

Totem is a web-based application that allows users to create custom audio books for the Tiptoi electronic pen system. It runs entirely in the browser with no backend, using Web Workers for compute-intensive tasks. Users can upload audio files and generate GME (Game Mode Electronics) files that work with Tiptoi devices, along with printable visual codes.

**Repository Stats:**
- Size: ~1.4MB source code, 142 source files
- Type: Single-page web application
- Main language: TypeScript (~724 lines in largest file)
- Build output: Static site in `dist/` directory

## Technology Stack

- **Runtime/Package Manager**: Bun v1.2+ (required)
- **Bundler**: Vite 6.x
- **Framework**: React 19
- **UI Library**: Mantine 7.x
- **TypeScript**: 5.7.x (strict mode enabled)
- **Testing**: Vitest 2.x with jsdom
- **Linting**: ESLint 9.x (eslint-config-love) + Prettier 3.x

## Prerequisites

You MUST install Bun before running any commands:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bash_profile
```

Verify with: `bun --version` (should show 1.2+)

## Development Workflow

### Initial Setup

**ALWAYS run these commands in this exact order:**

```bash
bun install          # Install all dependencies (takes ~30s)
```

### Core Commands

All commands must be prefixed with `bun run` or `bun`:

```bash
# Development server (starts on http://localhost:5173)
bun run dev

# Linting (check only)
bun run lint

# Auto-fix linting issues (ALWAYS use this before committing)
bun run lint:fix

# Run tests (takes ~3-4 seconds)
bun run test

# Run tests in watch mode with UI
bun run test:dev

# Build for production (takes ~7 seconds, creates dist/)
bun run build

# Preview production build (serves from dist/)
bun run preview
```

### Critical Command Notes

1. **ALWAYS run `bun install` before any other command** in a fresh environment
2. **ALWAYS run `bun run lint:fix` before committing** - the CI requires this
3. Tests take only ~3-4 seconds - if timing out, the issue is likely with tttool download (see below)
4. Build creates a `dist/` directory with production assets
5. The `lint` command runs `prettier src --check && eslint src` sequentially

## Testing

### Test Structure

- Uses Vitest with jsdom environment
- Only 2 test files:
  - `src/components/OIDCode/OIDCode.spec.tsx` - Component tests
  - `src/util/gme/__specs__/gme.spec.ts` - GME file generation tests

### Important Test Details

**tttool Binary Download:**
The tests automatically download a binary tool called `tttool` (v1.11) from GitHub on first run. This download:
- Goes to `/tmp/totem-tttool/`
- Only happens once per environment
- Has a 60-second timeout in `beforeAll` hook
- Tests will fail if this download times out or fails

**Test Timeouts:**
- First test run: Allow 60+ seconds for tttool download
- Subsequent runs: ~3-4 seconds
- The "should produce a valid gme file" test has a 10-second timeout
- If tests timeout, it's likely a network issue downloading tttool

**Test Files Location:**
Test audio files (.ogg) are located in `src/util/gme/__specs__/` directory alongside the test file.

### Running Specific Tests

```bash
# Run only the GME validation test
bun run test:debug
```

## Project Structure

### Root Directory

```
/
├── .editorconfig          # Editor settings (2-space indent, LF endings)
├── .github/
│   └── workflows/         # CI/CD pipeline definitions
├── .gitignore             # Excludes: node_modules, dist, *.local
├── .prettierrc            # Prettier config (tabWidth: 2, useTabs: false)
├── CONTRIBUTING.md        # Detailed development docs
├── README.md              # User-facing documentation
├── bun.lockb              # Bun lockfile (binary format)
├── eslint.config.mjs      # ESLint 9 flat config
├── index.html             # App entry point
├── package.json           # Dependencies and scripts
├── public/                # Static assets (feather.svg)
├── src/                   # All source code
├── tsconfig.json          # TypeScript configuration
└── vite.config.mjs        # Vite configuration
```

### Source Directory (`src/`)

```
src/
├── components/            # React components
│   ├── App/              # Main app component
│   ├── icons/            # Icon components (use Lucide collection)
│   ├── LayoutPanel/      # Layout configuration panels
│   ├── PrintLayout/      # Print layout components
│   ├── OIDCode/          # OID (optical identification) code components
│   └── ...               # Other UI components
├── hooks/
│   └── useI18n/          # Internationalization (de_DE, es_ES, fr_FR, it_IT)
├── types/                # TypeScript type definitions
├── util/                 # Utility functions and core logic
│   ├── gme/              # GME file generation (key module)
│   │   ├── gme.ts       # Main GME logic (724 lines)
│   │   ├── gme.worker.ts # Web Worker for GME building
│   │   ├── __specs__/   # Test files and test audio
│   │   └── useGmeBuilder.ts
│   ├── mp3/              # MP3 processing
│   │   ├── decoder.worker.ts # Web Worker for MP3 decoding
│   │   └── ...
│   └── tttool.ts         # tttool binary wrapper
├── main.tsx              # React app entry point
└── vite-env.d.ts         # Vite type definitions
```

### Key Files

- **`src/main.tsx`**: App entry point, sets up Mantine provider
- **`src/util/gme/gme.ts`**: Core GME file building logic (largest file)
- **`src/util/tttool.ts`**: Wrapper for tttool binary validation
- **`vite.config.mjs`**: Vite config with React, TypeScript checker, markdown plugin
- **`eslint.config.mjs`**: ESLint config with love preset and custom overrides

## Configuration Files

### Vite Configuration (`vite.config.mjs`)

```javascript
// Key settings:
- base: './'                    // Relative paths for deployment
- plugins: react, checker, markdown
- worker.format: 'es'           // ES module format for workers
- optimizeDeps.exclude: ['fsevents']
```

### TypeScript Configuration (`tsconfig.json`)

```json
// Key settings:
- strict: true
- moduleResolution: "Bundler"
- jsx: "react-jsx"
- jsxImportSource: "react"
- noUnusedLocals: true
- noUnusedParameters: true
```

### ESLint Configuration (`eslint.config.mjs`)

Based on `eslint-config-love` with disabled rules:
- `promise/avoid-new`
- `@typescript-eslint/explicit-function-return-type`
- `@typescript-eslint/prefer-destructuring`
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-confusing-void-expression`
- `@typescript-eslint/no-magic-numbers`

## Web Workers

The project uses Web Workers for computationally intensive tasks:

### Worker Files

1. **`src/util/gme/gme.worker.ts`**: GME file building
2. **`src/util/mp3/decoder.worker.ts`**: MP3 decoding

### Worker Import Pattern

Workers are imported using Vite's special `?worker` suffix:

```typescript
import Worker from "./worker?worker";
```

This is **mandatory** - do not import workers as regular modules.

## CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

1. **`test.yml`** - Runs on every push
   ```yaml
   Steps:
   1. Checkout code
   2. Setup Bun (latest)
   3. bun install
   4. bun lint:fix && git diff  # Fails if formatting changes needed
   5. bun run test
   ```

2. **`deploy.yml`** - Deploys to GitHub Pages
   ```yaml
   Trigger: After test workflow succeeds on main branch
   Steps:
   1. Checkout code
   2. Setup Bun (latest)
   3. bun install
   4. VITE_GIT_HASH=${GITHUB_SHA::6} bun run build
   5. Deploy dist/ to GitHub Pages
   ```

### Pre-Commit Checklist

To ensure CI passes:

1. ✅ Run `bun run lint:fix` (required)
2. ✅ Run `bun run test` (all tests must pass)
3. ✅ Run `bun run build` (verify no build errors)
4. ✅ Check `git diff` after lint:fix (should be empty)

## Code Style Guidelines

### General

- Use 2-space indentation (enforced by Prettier)
- LF line endings (enforced by .editorconfig)
- TypeScript strict mode is enabled
- No unused locals or parameters (enforced by tsconfig)

### Icon Components

When adding icons, use the Lucide collection and include a comment:

```typescript
// https://icones.js.org/collection/lucide?s=icon-name
export default function IconName(props: SVGProps<SVGSVGElement>) {
  // ... icon SVG
}
```

### Markdown Files

Markdown files are imported using vite-plugin-markdown:

```typescript
import { markdown as content } from './README.md'
<Markdown>{content}</Markdown>
```

## Special Considerations

### tttool Binary

- **Purpose**: Validates generated GME files in tests
- **Version**: 1.11 (hardcoded in `src/util/tttool.ts`)
- **Download**: Automatic on first test run
- **Location**: `/tmp/totem-tttool/`
- **URL**: `https://github.com/entropia/tip-toi-reveng/releases/download/1.11/tttool-1.11.zip`
- **Permissions**: Automatically set to 0o755 on Linux

### Known TODO/FIXME Items

Found in codebase (do not fix unless related to your task):
- `src/util/gme/gme.ts`: "FIXME allow multiple playlists"
- `src/util/gme/gme.ts`: "TODO refactor into more chunks" (max-lines eslint disabled)
- Test file: "TODO compare audio files byte-by-byte"

### Build Warnings

The build process shows a warning about chunk size:
```
(!) Some chunks are larger than 500 kB after minification.
```
This is **expected** and not an error. Do not try to fix unless specifically tasked.

## Troubleshooting

### "bun: command not found"

**Solution**: Install Bun and source the profile:
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bash_profile
```

### Test timeout on first run

**Cause**: tttool binary download taking >60s
**Solution**: This is a network issue. The download happens once and is cached.

### Linting failures in CI

**Cause**: Code not formatted with Prettier
**Solution**: Run `bun run lint:fix` before committing

### Build failures with "Cannot find module"

**Cause**: Missing dependencies
**Solution**: Run `bun install`

### Tests fail with "Missing track data"

**Cause**: Test audio files not found
**Solution**: Check that `.ogg` files exist in `src/util/gme/__specs__/`

## Summary: Trust These Instructions

**For any new task in this repository:**

1. Start with `bun install`
2. Make your changes
3. Run `bun run lint:fix`
4. Run `bun run test`
5. Run `bun run build` to verify
6. Commit if all pass

**Do not search for build/test commands** - they are documented above. Only search if these instructions are incomplete or incorrect.

**Build time estimates:**
- `bun install`: ~30 seconds
- `bun run lint`: ~1 second  
- `bun run test`: ~3-4 seconds (60+ on first run)
- `bun run build`: ~7 seconds

**CI will fail if:**
- Linting is not clean (run `bun run lint:fix`)
- Tests don't pass
- Build fails

## Copilot Agent Guidelines

### Principle: Make Minimal Changes

When working on issues:
- **Make surgical edits** - change only what's necessary to fix the issue
- **Preserve working code** - don't refactor or "improve" code unless that's the task
- **Keep formatting consistent** - match existing code style
- **Don't fix unrelated issues** - stay focused on the task at hand

### Efficient Tool Usage

**Explore the codebase efficiently:**
```
# Read multiple files simultaneously
view(file1), view(file2), view(file3)

# Check related files in one call
view(component), view(test), view(types)
```

**Validate changes thoroughly:**
```
# After making changes, validate in one go
bash("bun run lint:fix && bun run test && bun run build")
```

### Common Task Patterns

**Adding a new React component:**
1. Create component file in appropriate directory (e.g., `src/components/`)
2. Use existing components as templates for structure
3. Import icon from Lucide collection if needed (add source comment)
4. Export from `index.ts` in the same directory
5. Run `bun run lint:fix` to ensure formatting
6. Test if component has user-facing changes

**Updating internationalization:**
1. Add keys to all locale files in `src/hooks/useI18n/` (de_DE, es_ES, fr_FR, it_IT)
2. Keep translations consistent across locales
3. Use the `useI18n()` hook in components

**Modifying GME generation:**
1. Changes likely go in `src/util/gme/gme.ts`
2. Run tests with `bun run test` - the GME test validates with tttool
3. Be aware of max-lines eslint disable for this file
4. Don't modify the tttool version (1.11) unless specifically needed

**Adding Web Workers:**
1. Create `*.worker.ts` file
2. Import with `?worker` suffix: `import Worker from "./file?worker"`
3. Follow existing patterns in `gme.worker.ts` or `decoder.worker.ts`
4. Never import workers as regular modules

### What NOT to Do

❌ Don't add new dependencies unless absolutely necessary
❌ Don't change Bun version or update lock file manually
❌ Don't modify CI/CD workflows unless that's the task
❌ Don't add new linting rules or configurations
❌ Don't fix TODO/FIXME comments unless that's the issue
❌ Don't try to reduce the chunk size warning (it's expected)
❌ Don't modify test timeout values without understanding why they exist
