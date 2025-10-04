# TODO/FIXME to GitHub Issues Script

This script automates the creation of GitHub issues from TODO and FIXME comments found in the Totem codebase.

## Overview

The script has catalogued **25 TODO and FIXME items** across the codebase:

- **16 E2E test TODOs** - Missing end-to-end tests for various features
- **3 Component TODOs** - Incomplete UI components
- **6 Code TODOs/FIXMEs** - Code improvements, refactoring, and bug fixes

## Key Features

- **Idempotent**: Only creates issues for new TODO/FIXME items, skips duplicates
- **GitHub Actions**: Can be triggered manually from the Actions tab
- **Automatic labeling**: Applies appropriate labels for categorization
- **Dry-run mode**: Preview changes before creating issues

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

### Option 1: GitHub Actions (Recommended)

The easiest way to create issues is using the GitHub Actions workflow:

1. Go to the **Actions** tab in the GitHub repository
2. Select **"Create Issues from TODOs"** workflow
3. Click **"Run workflow"**
4. Click the green **"Run workflow"** button

The workflow will:
- Check out the repository
- Install dependencies
- Run the script to create issues
- Skip any issues that already exist (idempotent)

### Option 2: Manual Execution

#### Dry Run (Preview Mode)

Preview what issues would be created without actually creating them:

```bash
bun run scripts/create-issues-from-todos.ts --dry-run
```

This will display:
- The title of each issue
- The file and line number
- The labels that would be applied
- The full issue body

#### Create Issues

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
2. Fetch existing open issues to check for duplicates
3. Create each new issue with appropriate title, body, and labels
4. Skip issues that already exist (same title)
5. Display a summary of created/skipped issues

**Note**: The script is **idempotent** - running it multiple times will not create duplicate issues. It checks for existing open issues with the same title and skips them.

## GitHub Actions Configuration

The repository includes a GitHub Actions workflow (`.github/workflows/create-issues-from-todos.yml`) that can be triggered manually to create issues.

### Required Permissions

The workflow requires the following permissions (already configured):
- `contents: read` - To check out the repository
- `issues: write` - To create GitHub issues

These permissions are granted automatically when using `github.token` in the workflow.

### Running the Workflow

1. Navigate to the **Actions** tab in the GitHub repository
2. Select **"Create Issues from TODOs"** from the workflow list
3. Click **"Run workflow"** button
4. Select the branch (usually `main`)
5. Click the green **"Run workflow"** button

The workflow will execute the script and create issues automatically. No additional configuration is needed.

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

- The script will fail if GitHub CLI is not authenticated (for manual execution)
- The script is **idempotent** - it checks for existing issues and skips duplicates
- Only open issues are checked for duplicates; closed issues are ignored
- Labels must exist in the repository (they will be created automatically by GitHub if needed)
- Issues are created in the current repository (lordvlad/totem)
- Use `--dry-run` to preview changes before creating issues
- When run via GitHub Actions, the workflow uses the built-in `GITHUB_TOKEN` which has permissions to create issues

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
