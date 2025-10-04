# Automated TODO/FIXME Issue Creation

This directory contains automation scripts for the Totem project.

## create-issues-from-todos.ts

Automatically scans the repository for TODO and FIXME comments and creates GitHub issues from them.

### Features

- **Comprehensive Scanning**: Searches all TypeScript, JavaScript, and related files
- **Context Preservation**: Includes 2 lines before and after each comment
- **Commit Tracking**: Records the commit hash where the comment was detected
- **Idempotent**: Won't create duplicate issues (checks existing issues by title)
- **Formatted Output**: Creates well-formatted GitHub issues with code context

### Usage

The script is automatically run by the GitHub Actions workflow `.github/workflows/create-issues-from-todos.yml` on every push to the main/master branch.

To run manually:

```bash
export GITHUB_TOKEN="your-token-here"
export GITHUB_REPOSITORY="owner/repo"
export GITHUB_SHA="commit-hash"
bun run .github/create-issues-from-todos.ts
```

### Issue Format

Each created issue will have:

- **Title**: `[TODO|FIXME] <comment text>`
- **Labels**: `todo` or `fixme`
- **Body**: 
  - File path and line number
  - Commit hash (first 7 characters)
  - Code context (2 lines before and after)
  - Timestamp

### Example

For a comment like:

```typescript
// TODO: Add test for audio file upload
```

An issue will be created with:

```
Title: [TODO] Add test for audio file upload
Label: todo

Body:
**File**: `e2e/audio.spec.ts`
**Line**: 14
**Commit**: abc1234

### Context

```
  12:   });
  13: 
→ 14:   // TODO: Add test for audio file upload
  15:   // - Test file upload functionality
  16:   // - Verify files are processed
```

### Details

This issue was automatically created from a TODO comment found in the codebase.

---
*Created by automated TODO/FIXME scanner on 2025-10-04T20:00:00.000Z*
```

### Configuration

The workflow is configured in `.github/workflows/create-issues-from-todos.yml`:

- Triggers on push to main/master branches
- Has `issues: write` permission
- Uses Bun as the TypeScript runtime
