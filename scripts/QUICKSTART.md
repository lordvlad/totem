# Quick Start Guide: Creating GitHub Issues from TODO/FIXME Comments

## What This Does

This script found **25 TODO and FIXME comments** throughout the Totem codebase and creates a GitHub issue for each one, with proper categorization, labels, and context.

## Prerequisites

1. Install GitHub CLI: `brew install gh` (macOS) or visit https://cli.github.com/
2. Authenticate: `gh auth login`

## Usage

### Preview Mode (Recommended First Step)

See what issues would be created without actually creating them:

```bash
bun run create-issues --dry-run
```

This shows:
- All 25 TODO/FIXME items
- Issue titles
- File locations and line numbers
- Labels that would be applied
- Full issue descriptions

### Create All Issues

When you're ready to create the issues:

```bash
bun run create-issues
```

This will:
1. Verify GitHub CLI authentication
2. Create 25 issues in the lordvlad/totem repository
3. Show progress and URLs for each created issue
4. Display a summary of successes/failures

## What Gets Created

### 16 E2E Testing Issues
- Audio upload and playback tests
- GME file generation tests
- OID code generation tests
- Locale and theme switching tests

**Labels:** `testing`, `e2e`, `audio`, `oid`, `enhancement`

### 3 Component Issues
- TableOptionsPanel implementation
- CustomLayoutPanel completion
- AlbumInfo component

**Labels:** `component`, `ui`, `enhancement`

### 6 Code Quality Issues
- Worker event investigations (2)
- Code refactoring (gme.ts)
- Multiple playlist support (FIXME)
- Test improvements
- TypeScript typing fix (FIXME)

**Labels:** `code-quality`, `worker`, `investigation`, `refactoring`, `typescript`, `bug`

## Files in This Directory

- **create-issues-from-todos.ts** - Main executable script
- **README.md** - Detailed documentation
- **SUMMARY.md** - Complete analysis of all TODO/FIXME items
- **QUICKSTART.md** - This file

## Need Help?

- Read the full documentation: `scripts/README.md`
- Review the analysis: `scripts/SUMMARY.md`
- Check what would be created: `bun run create-issues --dry-run`

## Note

The script does not modify any source code files. All TODO/FIXME comments remain in the codebase. The script only creates GitHub issues to track them.
