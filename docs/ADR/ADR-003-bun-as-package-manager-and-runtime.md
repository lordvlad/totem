# ADR-003: Bun as Package Manager and Runtime

## Status

Accepted

## Context

The project needs a fast, modern package manager and JavaScript runtime for:
- Installing dependencies efficiently
- Running development scripts
- Executing tests
- Building the production bundle
- Running linters and formatters

Options considered:
- npm (traditional, slower)
- yarn (faster, complex workspaces)
- pnpm (disk-efficient, symlinks)
- Bun (all-in-one, extremely fast)

## Decision

Use Bun v1.2+ as the exclusive package manager and runtime for all development tasks.

**Requirements:**
- Bun v1.2 or later
- Node.js v22 or later (for Promise.withResolvers support)

**All commands must use Bun:**
```bash
bun install          # Not npm install
bun run dev          # Not npm run dev
bun test            # Not npm test
```

## Rationale

1. **Speed**: Bun is significantly faster than npm/yarn for install and script execution
2. **Built-in Test Runner**: Native test runner with jsdom support (no need for Jest/Vitest separately)
3. **All-in-One**: Combines package manager, runtime, bundler, and test runner
4. **Modern APIs**: First-class support for modern JavaScript features
5. **Drop-in Replacement**: Compatible with npm package.json and lockfile concepts
6. **Simplified Tooling**: Reduces the number of tools in the stack

## Consequences

### Positive
- Extremely fast `bun install` (~19ms for clean install with cache)
- Fast test execution (~3-4 seconds for full test suite)
- Single tool for most development needs
- Smaller dependency footprint
- Native TypeScript support
- No need for ts-node or similar tools
- Built-in .env file support

### Negative
- Contributors must install Bun (additional setup step)
- Bun-specific lockfile format (`bun.lockb` is binary)
- Potential compatibility issues with some npm packages
- Less mature ecosystem compared to npm/yarn
- CI/CD must include Bun installation step
- Cannot easily switch back to npm without migration

## Implementation Details

### Installation

**Required on all development machines:**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bash_profile
bun --version  # Should show 1.2+
```

### Configuration Files

**package.json:**
```json
{
  "engines": {
    "node": ">=22.0.0"
  },
  "type": "module"
}
```

**bunfig.toml:**
Test configuration including jsdom setup:
```toml
[test]
preload = "./test-setup.ts"
```

### Script Patterns

All scripts in `package.json` use Bun:
```json
{
  "scripts": {
    "dev": "vite dev",
    "test": "bun test src",
    "lint:fix": "prettier src --write && eslint src --fix",
    "pretest": "bun -e 'import(\"./src/util/tttool.ts\").then(m => m.tttool(\"--help\"))'",
  }
}
```

### CI Integration

GitHub Actions workflow:
```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Run tests
  run: bun test
```

### Performance Benchmarks

Typical times (on CI):
- `bun install` (cached): ~19ms
- `bun install` (fresh): ~30s
- `bun run test`: ~3-4s (60s first run for tttool download)
- `bun run build`: ~7s

## Migration Notes

**From npm/yarn to Bun:**
1. Install Bun
2. Delete `node_modules` and `package-lock.json`/`yarn.lock`
3. Run `bun install`
4. Bun generates `bun.lockb` automatically

**Lockfile:**
- `bun.lockb` is a binary format (not human-readable)
- Committed to git for consistency
- Automatically updated by `bun install` when dependencies change

## Notes

**Do not use npm or yarn commands** in this project. All scripts and installations must use Bun.

**Version Requirements:**
- Bun v1.2+ is required for modern features and stability
- Node.js v22+ is required as a fallback runtime and for some dependencies

The `.github/copilot-instructions.md` provides detailed troubleshooting for Bun installation issues.

**Contributors must install Bun** before starting development. This is documented in:
- `CONTRIBUTING.md`
- `.github/copilot-instructions.md`
- This ADR
