#!/usr/bin/env bun
/**
 * Script to create GitHub issues from TODO and FIXME comments in the codebase
 * 
 * Usage:
 *   bun run scripts/create-issues-from-todos.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what issues would be created without actually creating them
 * 
 * Requirements:
 *   - GitHub CLI (gh) must be installed and authenticated
 *   - Run: gh auth login
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

interface TodoItem {
  file: string;
  line: number;
  type: "TODO" | "FIXME";
  title: string;
  body: string;
  labels: string[];
}

interface ExistingIssue {
  number: number;
  title: string;
  state: string;
}

const TODO_ITEMS: TodoItem[] = [
  // E2E Test TODOs - e2e/app.spec.ts
  {
    file: "e2e/app.spec.ts",
    line: 37,
    type: "TODO",
    title: "Add E2E test for audio file upload functionality",
    body: `## Description
Add end-to-end tests for audio file upload functionality.

## Tasks
- [ ] Test uploading MP3/OGG files
- [ ] Verify audio tracks appear in the list
- [ ] Test track reordering/deletion

## Location
File: \`e2e/app.spec.ts\`, Line: 37-40

## Context
This test should verify the complete workflow of uploading audio files and managing them in the track list.`,
    labels: ["testing", "e2e", "enhancement"],
  },
  {
    file: "e2e/app.spec.ts",
    line: 42,
    type: "TODO",
    title: "Add E2E test for GME file generation",
    body: `## Description
Add end-to-end tests for GME file generation workflow.

## Tasks
- [ ] Upload audio files
- [ ] Configure product ID and language
- [ ] Generate GME file
- [ ] Verify download triggers

## Location
File: \`e2e/app.spec.ts\`, Line: 42-46

## Context
This test should verify the complete workflow of generating a GME file from uploaded audio tracks.`,
    labels: ["testing", "e2e", "enhancement"],
  },
  {
    file: "e2e/app.spec.ts",
    line: 48,
    type: "TODO",
    title: "Add E2E test for OID code generation",
    body: `## Description
Add end-to-end tests for OID code generation functionality.

## Tasks
- [ ] Generate OID codes for tracks
- [ ] Verify SVG patterns are created
- [ ] Test print layout configuration

## Location
File: \`e2e/app.spec.ts\`, Line: 48-51

## Context
This test should verify that OID codes are correctly generated and can be used in print layouts.`,
    labels: ["testing", "e2e", "enhancement"],
  },
  {
    file: "e2e/app.spec.ts",
    line: 53,
    type: "TODO",
    title: "Add E2E test for locale switching",
    body: `## Description
Add end-to-end tests for locale/language switching functionality.

## Tasks
- [ ] Test switching between supported languages (de_DE, es_ES, fr_FR, it_IT)
- [ ] Verify UI text updates accordingly

## Location
File: \`e2e/app.spec.ts\`, Line: 53-55

## Context
This test should verify that the internationalization (i18n) system works correctly and all UI text updates when switching languages.`,
    labels: ["testing", "e2e", "i18n", "enhancement"],
  },
  {
    file: "e2e/app.spec.ts",
    line: 57,
    type: "TODO",
    title: "Add E2E test for theme switching",
    body: `## Description
Add end-to-end tests for light/dark theme toggle functionality.

## Tasks
- [ ] Test light/dark theme toggle
- [ ] Verify theme persistence

## Location
File: \`e2e/app.spec.ts\`, Line: 57-59

## Context
This test should verify that users can switch between light and dark themes and that the preference is persisted.`,
    labels: ["testing", "e2e", "ui", "enhancement"],
  },
  // E2E Test TODOs - e2e/audio.spec.ts
  {
    file: "e2e/audio.spec.ts",
    line: 14,
    type: "TODO",
    title: "Add E2E test for audio file upload via drag and drop",
    body: `## Description
Add end-to-end tests for drag-and-drop audio file upload.

## Tasks
- [ ] Test dropping MP3 files onto dropzone
- [ ] Verify files are added to track list
- [ ] Check that metadata (title, artist) is extracted

## Location
File: \`e2e/audio.spec.ts\`, Line: 14-17

## Context
This test should verify the drag-and-drop upload workflow and metadata extraction.`,
    labels: ["testing", "e2e", "audio", "enhancement"],
  },
  {
    file: "e2e/audio.spec.ts",
    line: 19,
    type: "TODO",
    title: "Add E2E test for audio file upload via file picker",
    body: `## Description
Add end-to-end tests for audio file upload using the file picker.

## Tasks
- [ ] Click upload button
- [ ] Select files through file input
- [ ] Verify tracks appear in the list

## Location
File: \`e2e/audio.spec.ts\`, Line: 19-22

## Context
This test should verify the file picker upload workflow.`,
    labels: ["testing", "e2e", "audio", "enhancement"],
  },
  {
    file: "e2e/audio.spec.ts",
    line: 24,
    type: "TODO",
    title: "Add E2E test for recording audio through microphone",
    body: `## Description
Add end-to-end tests for microphone audio recording.

## Tasks
- [ ] Grant microphone permissions (if modal is implemented)
- [ ] Start recording
- [ ] Stop recording
- [ ] Verify recorded audio appears as track

## Location
File: \`e2e/audio.spec.ts\`, Line: 24-28

## Context
This test should verify the complete microphone recording workflow.`,
    labels: ["testing", "e2e", "audio", "enhancement"],
  },
  {
    file: "e2e/audio.spec.ts",
    line: 30,
    type: "TODO",
    title: "Add E2E test for audio playback controls",
    body: `## Description
Add end-to-end tests for audio playback controls.

## Tasks
- [ ] Upload a test audio file
- [ ] Click play button on a track
- [ ] Verify audio plays (check for audio context creation)
- [ ] Test pause/stop functionality

## Location
File: \`e2e/audio.spec.ts\`, Line: 30-34

## Context
This test should verify that audio playback controls work correctly.`,
    labels: ["testing", "e2e", "audio", "enhancement"],
  },
  {
    file: "e2e/audio.spec.ts",
    line: 36,
    type: "TODO",
    title: "Add E2E test for preventing multiple MediaElementSource issue",
    body: `## Description
Add end-to-end tests to verify that the MediaElementSource issue is properly handled.

## Tasks
- [ ] Play an audio track
- [ ] Stop and replay the same track
- [ ] Verify no "InvalidStateError" occurs
- [ ] Ensure new Audio element is created for each playback

## Location
File: \`e2e/audio.spec.ts\`, Line: 36-40

## Context
This test should verify that replaying audio tracks doesn't cause InvalidStateError by ensuring proper cleanup of MediaElementSource.`,
    labels: ["testing", "e2e", "audio", "bug", "enhancement"],
  },
  {
    file: "e2e/audio.spec.ts",
    line: 42,
    type: "TODO",
    title: "Add E2E test for track management",
    body: `## Description
Add end-to-end tests for track management features.

## Tasks
- [ ] Add multiple tracks
- [ ] Test reordering tracks via drag and drop
- [ ] Test deleting tracks
- [ ] Test editing track metadata

## Location
File: \`e2e/audio.spec.ts\`, Line: 42-46

## Context
This test should verify all track management operations work correctly.`,
    labels: ["testing", "e2e", "audio", "enhancement"],
  },
  // E2E Test TODOs - e2e/oid-codes.spec.ts
  {
    file: "e2e/oid-codes.spec.ts",
    line: 10,
    type: "TODO",
    title: "Implement navigation to OID codes section in E2E test",
    body: `## Description
Complete the E2E test by adding navigation to the section where OID codes are displayed.

## Location
File: \`e2e/oid-codes.spec.ts\`, Line: 10-11

## Context
This will depend on how the app workflow is structured. Currently the test only verifies the app loads without errors.`,
    labels: ["testing", "e2e", "enhancement"],
  },
  {
    file: "e2e/oid-codes.spec.ts",
    line: 18,
    type: "TODO",
    title: "Add E2E test for OID code pattern generation",
    body: `## Description
Add end-to-end tests for OID code pattern generation.

## Tasks
- [ ] Navigate to print layout section
- [ ] Verify SVG elements with OID patterns are generated
- [ ] Check that pattern IDs match expected format (pattern.{code})
- [ ] Verify path elements are present within patterns

## Location
File: \`e2e/oid-codes.spec.ts\`, Line: 18-22

## Context
This test should verify that OID patterns are correctly generated in SVG format.`,
    labels: ["testing", "e2e", "oid", "enhancement"],
  },
  {
    file: "e2e/oid-codes.spec.ts",
    line: 24,
    type: "TODO",
    title: "Add E2E test for OID code pixel size configuration",
    body: `## Description
Add end-to-end tests for OID code pixel size configuration.

## Tasks
- [ ] Test adjusting pixel size setting
- [ ] Verify pattern density changes accordingly

## Location
File: \`e2e/oid-codes.spec.ts\`, Line: 24-26

## Context
This test should verify that changing the pixel size setting affects the OID pattern density.`,
    labels: ["testing", "e2e", "oid", "enhancement"],
  },
  {
    file: "e2e/oid-codes.spec.ts",
    line: 28,
    type: "TODO",
    title: "Add E2E test for print layout options",
    body: `## Description
Add end-to-end tests for print layout options.

## Tasks
- [ ] Test different layout configurations (grid, list, etc.)
- [ ] Verify correct number of OID codes are displayed
- [ ] Test stop/replay OID codes

## Location
File: \`e2e/oid-codes.spec.ts\`, Line: 28-31

## Context
This test should verify that different print layout options work correctly.`,
    labels: ["testing", "e2e", "oid", "print", "enhancement"],
  },
  {
    file: "e2e/oid-codes.spec.ts",
    line: 33,
    type: "TODO",
    title: "Add E2E test for OID code download/print",
    body: `## Description
Add end-to-end tests for OID code download and print functionality.

## Tasks
- [ ] Generate a print layout
- [ ] Trigger print dialog
- [ ] Verify SVG content is printer-friendly (1200 DPI)

## Location
File: \`e2e/oid-codes.spec.ts\`, Line: 33-36

## Context
This test should verify that the print/download functionality produces high-quality output suitable for printing.`,
    labels: ["testing", "e2e", "oid", "print", "enhancement"],
  },
  // Component TODOs
  {
    file: "src/components/LayoutPanel/TableLayoutPanel/TableOptionsPanel.tsx",
    line: 13,
    type: "TODO",
    title: "Implement TableOptionsPanel component",
    body: `## Description
Complete the implementation of the TableOptionsPanel component.

## Location
File: \`src/components/LayoutPanel/TableLayoutPanel/TableOptionsPanel.tsx\`, Line: 13

## Current State
The component currently returns \`<>TODO...</>\`.

## Context
This component should provide options for configuring table-based print layouts.`,
    labels: ["component", "ui", "enhancement"],
  },
  {
    file: "src/components/LayoutPanel/CustomLayoutPanel/CustomLayoutPanel.tsx",
    line: 13,
    type: "TODO",
    title: "Complete CustomLayoutPanel implementation",
    body: `## Description
Complete the implementation of the CustomLayoutPanel component.

## Location
File: \`src/components/LayoutPanel/CustomLayoutPanel/CustomLayoutPanel.tsx\`, Line: 13

## Current State
The component includes CommonOptionsPanel but has \`TODO...\` for additional functionality.

## Context
This component should provide options for configuring custom print layouts.`,
    labels: ["component", "ui", "enhancement"],
  },
  {
    file: "src/components/PrintLayout/AlbumInfo.tsx",
    line: 2,
    type: "TODO",
    title: "Implement AlbumInfo component",
    body: `## Description
Complete the implementation of the AlbumInfo component.

## Location
File: \`src/components/PrintLayout/AlbumInfo.tsx\`, Line: 2

## Current State
The component currently returns \`<>TODO ...</>\`.

## Context
This component should display album information in the print layout.`,
    labels: ["component", "ui", "enhancement"],
  },
  // Code TODOs
  {
    file: "src/util/gme/gme.worker.ts",
    line: 40,
    type: "TODO",
    title: "Investigate source of 'isTrusted' event in GME worker",
    body: `## Description
Find out where the "isTrusted" event is coming from in the GME worker.

## Location
File: \`src/util/gme/gme.worker.ts\`, Line: 40

## Current Code
\`\`\`typescript
} else if ("isTrusted" in event) {
  // TODO find out where this event is coming from.
  console.info("isTrusted:", event.isTrusted);
}
\`\`\`

## Context
The worker receives an event with an \`isTrusted\` property, but the source is unknown. This needs investigation to properly handle or document the event.`,
    labels: ["investigation", "worker", "code-quality"],
  },
  {
    file: "src/util/gme/gme.ts",
    line: 2,
    type: "TODO",
    title: "Refactor gme.ts into smaller modules",
    body: `## Description
Refactor the large gme.ts file into more manageable chunks.

## Location
File: \`src/util/gme/gme.ts\`, Line: 2

## Current State
The file has \`max-lines\` ESLint rule disabled due to its size (724 lines).

## Context
Breaking this file into smaller, focused modules would improve maintainability and code organization. Consider separating concerns like:
- Header creation
- Script table generation
- Media table handling
- Layout creation
- File building

## Note
This is a larger refactoring task that should be planned carefully to avoid breaking existing functionality.`,
    labels: ["refactoring", "code-quality", "maintenance"],
  },
  {
    file: "src/util/gme/gme.ts",
    line: 586,
    type: "FIXME",
    title: "Support multiple playlists in GME file generation",
    body: `## Description
Add support for multiple playlists in the \`createPoweronSoundPlaylistList\` function.

## Location
File: \`src/util/gme/gme.ts\`, Line: 586

## Current Code
\`\`\`typescript
// FIXME allow multiple playlists
function createPoweronSoundPlaylistList({
  offset,
  trackIndices = [],
}: {
  trackIndices?: number[];
  offset: number;
}) {
\`\`\`

## Context
Currently the system only supports a single playlist. Adding support for multiple playlists would allow more complex audio book structures.`,
    labels: ["enhancement", "feature", "gme"],
  },
  {
    file: "src/util/gme/__specs__/gme.spec.ts",
    line: 150,
    type: "TODO",
    title: "Add byte-by-byte audio file comparison in tests",
    body: `## Description
Add byte-by-byte comparison of audio files in the GME tests.

## Location
File: \`src/util/gme/__specs__/gme.spec.ts\`, Line: 150

## Context
Currently the test validates the GME file structure and metadata, but doesn't compare the actual audio data byte-by-byte. This would provide more thorough validation of the GME file generation process.`,
    labels: ["testing", "enhancement", "gme"],
  },
  {
    file: "src/util/mp3/decoder.worker.ts",
    line: 68,
    type: "TODO",
    title: "Investigate source of 'isTrusted' event in MP3 decoder worker",
    body: `## Description
Find out where the "isTrusted" event is coming from in the MP3 decoder worker.

## Location
File: \`src/util/mp3/decoder.worker.ts\`, Line: 68

## Current Code
\`\`\`typescript
} else if ("isTrusted" in event) {
  // TODO find out where this event is coming from.
  console.info("isTrusted:", event.isTrusted);
}
\`\`\`

## Context
Similar to the GME worker, the MP3 decoder worker receives an event with an \`isTrusted\` property, but the source is unknown. This needs investigation to properly handle or document the event.`,
    labels: ["investigation", "worker", "code-quality"],
  },
  {
    file: "src/util/mp3/track.ts",
    line: 22,
    type: "FIXME",
    title: "Fix typing issue in Track class",
    body: `## Description
Fix the typing issue in the Track class that requires unsafe type assertions.

## Location
File: \`src/util/mp3/track.ts\`, Line: 22

## Current Code
\`\`\`typescript
// FIXME fix typing
/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/consistent-type-assertions -- allow this for now, fix later */
this.frames[id] = { data, id } as Frame;
\`\`\`

## Context
There's a typing issue that requires disabling TypeScript safety checks. This should be properly typed to maintain type safety throughout the codebase.`,
    labels: ["typescript", "code-quality", "bug"],
  },
];

function getExistingIssues(): ExistingIssue[] {
  try {
    // Get all open issues from the repository
    const result = execSync(
      'gh issue list --limit 1000 --state open --json number,title,state',
      {
        encoding: "utf-8",
        cwd: process.cwd(),
      }
    );
    return JSON.parse(result) as ExistingIssue[];
  } catch (error) {
    console.error(`⚠️  Warning: Could not fetch existing issues: ${error}`);
    return [];
  }
}

function issueExists(item: TodoItem, existingIssues: ExistingIssue[]): boolean {
  // Check if an issue with the same title already exists (open state)
  return existingIssues.some(issue => issue.title === item.title && issue.state === 'OPEN');
}

function createIssue(item: TodoItem, dryRun: boolean = false, existingIssues: ExistingIssue[] = []): { created: boolean, skipped: boolean } {
  const { title, body, labels, file, line, type } = item;

  console.log(`\n${"=".repeat(80)}`);
  console.log(`${type}: ${title}`);
  console.log(`File: ${file}:${line}`);
  console.log(`Labels: ${labels.join(", ")}`);
  console.log(`${"=".repeat(80)}`);

  // Check if issue already exists
  if (issueExists(item, existingIssues)) {
    console.log(`⊙ Issue already exists, skipping`);
    return { created: false, skipped: true };
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would create issue with body:");
    console.log(body);
    return { created: false, skipped: false };
  }

  try {
    // Create the issue using GitHub CLI
    const command = [
      "gh",
      "issue",
      "create",
      "--title",
      title,
      "--body",
      body,
      "--label",
      labels.join(","),
    ].join(" ");

    const result = execSync(command, {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    console.log(`✓ Created issue: ${result.trim()}`);
    return { created: true, skipped: false };
  } catch (error) {
    console.error(`✗ Failed to create issue: ${error}`);
    throw error;
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("Creating GitHub issues from TODO/FIXME comments");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Total items: ${TODO_ITEMS.length}`);

  let existingIssues: ExistingIssue[] = [];

  if (!dryRun) {
    // Check if gh is authenticated
    try {
      execSync("gh auth status", { encoding: "utf-8", stdio: "pipe" });
    } catch (error) {
      console.error("\n❌ Error: GitHub CLI is not authenticated.");
      console.error("Please run: gh auth login");
      process.exit(1);
    }

    // Fetch existing issues to check for duplicates
    console.log("\nFetching existing issues to check for duplicates...");
    existingIssues = getExistingIssues();
    console.log(`Found ${existingIssues.length} existing open issues`);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of TODO_ITEMS) {
    try {
      const result = createIssue(item, dryRun, existingIssues);
      if (result.created) {
        created++;
      } else if (result.skipped) {
        skipped++;
      } else if (dryRun) {
        // In dry-run mode, count items that would be created
        created++;
      }
    } catch (error) {
      failed++;
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("Summary:");
  console.log(`  Total: ${TODO_ITEMS.length}`);
  if (dryRun) {
    console.log(`  Would create: ${created + skipped}`);
  } else {
    console.log(`  Created: ${created}`);
    console.log(`  Skipped (already exist): ${skipped}`);
    console.log(`  Failed: ${failed}`);
  }
  console.log(`${"=".repeat(80)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
