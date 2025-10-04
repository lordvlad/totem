# TODO/FIXME Issue Creation Summary

## Overview

This document summarizes all TODO and FIXME comments found in the Totem codebase and provides a script to create GitHub issues for each one.

## Total Count: 25 Items

### Breakdown by Category

1. **E2E Tests (16 items)** - 64%
2. **Components (3 items)** - 12%  
3. **Code Quality (6 items)** - 24%

### Breakdown by Type

- **TODO:** 23 items (92%)
- **FIXME:** 2 items (8%)

## Detailed Listing

### E2E Testing TODOs (16 items)

#### e2e/app.spec.ts (5 items)
1. Line 37: Add test for audio file upload functionality
2. Line 42: Add test for GME file generation
3. Line 48: Add test for OID code generation
4. Line 53: Add test for locale switching
5. Line 57: Add test for theme switching

#### e2e/audio.spec.ts (6 items)
6. Line 14: Add test for audio file upload via drag and drop
7. Line 19: Add test for audio file upload via file picker
8. Line 24: Add test for recording audio through microphone
9. Line 30: Add test for audio playback controls
10. Line 36: Add test for preventing multiple MediaElementSource issue
11. Line 42: Add test for track management

#### e2e/oid-codes.spec.ts (5 items)
12. Line 10: Navigate to a section where OID codes are displayed
13. Line 18: Add test for OID code pattern generation
14. Line 24: Add test for OID code pixel size configuration
15. Line 28: Add test for print layout options
16. Line 33: Add test for OID code download/print

### Component TODOs (3 items)

17. **src/components/LayoutPanel/TableLayoutPanel/TableOptionsPanel.tsx:13**
    - Status: Placeholder component returning `<>TODO...</>`
    - Purpose: Options for table-based print layouts

18. **src/components/LayoutPanel/CustomLayoutPanel/CustomLayoutPanel.tsx:13**
    - Status: Partial implementation with `TODO...` text
    - Purpose: Options for custom print layouts

19. **src/components/PrintLayout/AlbumInfo.tsx:2**
    - Status: Placeholder component returning `<>TODO ...</>`
    - Purpose: Display album information in print layout

### Code Quality Items (6 items)

#### Investigation Needed (2 items)

20. **src/util/gme/gme.worker.ts:40** (TODO)
    - Issue: Unknown source of 'isTrusted' event in GME worker
    - Impact: Unclear event handling

21. **src/util/mp3/decoder.worker.ts:68** (TODO)
    - Issue: Unknown source of 'isTrusted' event in MP3 decoder worker
    - Impact: Unclear event handling

#### Refactoring/Enhancement (3 items)

22. **src/util/gme/gme.ts:2** (TODO)
    - Issue: File too large (724 lines, max-lines eslint disabled)
    - Suggestion: Split into smaller modules (header, script table, media table, layout, building)

23. **src/util/gme/gme.ts:586** (FIXME)
    - Issue: Only supports single playlist
    - Enhancement: Add support for multiple playlists

24. **src/util/gme/__specs__/gme.spec.ts:150** (TODO)
    - Enhancement: Add byte-by-byte audio file comparison in tests
    - Current: Only validates structure and metadata

#### Bug/Typing (1 item)

25. **src/util/mp3/track.ts:22** (FIXME)
    - Issue: Unsafe type assertion required
    - Impact: Reduced type safety
    - Code: `this.frames[id] = { data, id } as Frame;`

## Labels Used

The script applies appropriate labels to categorize issues:

- **testing** - Test-related items (16 issues)
- **e2e** - End-to-end tests (16 issues)
- **audio** - Audio functionality (6 issues)
- **oid** - OID code features (4 issues)
- **print** - Print layout (2 issues)
- **i18n** - Internationalization (1 issue)
- **ui** - User interface (4 issues)
- **component** - Component work (3 issues)
- **enhancement** - New features/improvements (22 issues)
- **bug** - Bugs to fix (2 issues)
- **feature** - New features (1 issue)
- **code-quality** - Code improvements (4 issues)
- **worker** - Web worker issues (2 issues)
- **investigation** - Needs research (2 issues)
- **refactoring** - Code refactoring (1 issue)
- **maintenance** - Maintenance work (1 issue)
- **gme** - GME file handling (2 issues)
- **typescript** - TypeScript issues (1 issue)

## Priority Recommendations

### High Priority
- **FIXME items (2)**: These explicitly call out issues that need fixing
  - Support multiple playlists (gme.ts:586)
  - Fix typing issue (track.ts:22)

### Medium Priority
- **Incomplete components (3)**: These affect user experience
  - TableOptionsPanel
  - CustomLayoutPanel  
  - AlbumInfo

- **Worker event investigation (2)**: Could indicate bugs
  - GME worker isTrusted event
  - MP3 decoder worker isTrusted event

### Lower Priority
- **E2E tests (16)**: Important for quality but app functions without them
- **Code refactoring (1)**: gme.ts modularization
- **Test improvements (1)**: Byte-by-byte comparison

## Usage

See `scripts/README.md` for detailed usage instructions.

### Quick Start

```bash
# Preview what issues would be created
bun run scripts/create-issues-from-todos.ts --dry-run

# Create all issues (requires gh auth login)
bun run create-issues
```

## Files Created

1. **scripts/create-issues-from-todos.ts** - Main script
2. **scripts/README.md** - Detailed usage documentation  
3. **scripts/SUMMARY.md** - This file
4. **package.json** - Added `create-issues` script

## Notes

- All TODO/FIXME items have been preserved in the codebase
- The script does not modify any source files
- Each issue includes file location, context, and appropriate labels
- Issues can be created individually or all at once
- Dry-run mode allows preview before creation
