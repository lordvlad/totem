# TODO/FIXME to GitHub Issues Script

This script automates the creation of GitHub issues from TODO and FIXME comments found in the Totem codebase.

## Overview

The script has catalogued **25 TODO and FIXME items** across the codebase:

- **16 E2E test TODOs** - Missing end-to-end tests for various features
- **3 Component TODOs** - Incomplete UI components
- **6 Code TODOs/FIXMEs** - Code improvements, refactoring, and bug fixes

## Prerequisites

1. **GitHub CLI (gh)** must be installed:
   ```bash
   # On macOS
   brew install gh
   
   # On Ubuntu/Debian
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   
   # On Windows
   winget install --id GitHub.cli
   ```

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

## Usage

### Dry Run (Preview Mode)

Preview what issues would be created without actually creating them:

```bash
bun run scripts/create-issues-from-todos.ts --dry-run
```

This will display:
- The title of each issue
- The file and line number
- The labels that would be applied
- The full issue body

### Create Issues

Create all issues in GitHub:

```bash
bun run scripts/create-issues-from-todos.ts
```

Or use the npm script:

```bash
bun run create-issues
```

The script will:
1. Check if GitHub CLI is authenticated
2. Create each issue with appropriate title, body, and labels
3. Display a summary of created issues

## Issue Categories

### E2E Testing (16 issues)
- Audio file upload (drag & drop, file picker)
- Audio recording and playback
- GME file generation
- OID code generation and configuration
- Print layout options
- Locale and theme switching
- Track management

Labels: `testing`, `e2e`, `audio`, `oid`, `enhancement`

### Components (3 issues)
- TableOptionsPanel implementation
- CustomLayoutPanel completion
- AlbumInfo component

Labels: `component`, `ui`, `enhancement`

### Code Quality (6 issues)
- Worker event investigation (2 issues)
- gme.ts refactoring
- Multiple playlist support
- Test improvements
- TypeScript typing fixes

Labels: `code-quality`, `worker`, `investigation`, `refactoring`, `typescript`, `bug`, `enhancement`

## Issue Format

Each issue includes:

- **Title**: Clear, concise description
- **Description**: What needs to be done
- **Tasks**: Checklist of specific items (when applicable)
- **Location**: File path and line number
- **Context**: Additional information about the change
- **Labels**: Categorization tags

## Example Issue

```markdown
## Description
Add end-to-end tests for audio file upload functionality.

## Tasks
- [ ] Test uploading MP3/OGG files
- [ ] Verify audio tracks appear in the list
- [ ] Test track reordering/deletion

## Location
File: `e2e/app.spec.ts`, Line: 37-40

## Context
This test should verify the complete workflow of uploading audio files 
and managing them in the track list.
```

## Customization

To add or modify TODO items:

1. Edit `scripts/create-issues-from-todos.ts`
2. Update the `TODO_ITEMS` array
3. Follow the existing structure for consistency

## Notes

- The script will fail if GitHub CLI is not authenticated
- Labels must exist in the repository or be created first
- Issues are created in the current repository (lordvlad/totem)
- Use `--dry-run` to preview changes before creating issues

## Labels Used

Make sure these labels exist in your repository:

- `testing`
- `e2e`
- `audio`
- `oid`
- `print`
- `i18n`
- `ui`
- `component`
- `enhancement`
- `bug`
- `feature`
- `code-quality`
- `worker`
- `investigation`
- `refactoring`
- `maintenance`
- `gme`
- `typescript`
