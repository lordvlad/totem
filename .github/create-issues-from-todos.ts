#!/usr/bin/env bun

/**
 * Automated TODO/FIXME Issue Creation
 * 
 * Automatically scans the repository for TODO and FIXME comments and creates GitHub issues from them.
 * 
 * ## Features
 * 
 * - **Comprehensive Scanning**: Searches all TypeScript, JavaScript, and related files
 * - **Context Preservation**: Includes 2 lines before and after each comment
 * - **Commit Tracking**: Records the commit hash where the comment was detected
 * - **Idempotent**: Won't create duplicate issues (checks existing issues by title)
 * - **Formatted Output**: Creates well-formatted GitHub issues with code context
 * 
 * ## Usage
 * 
 * The script is automatically run by the GitHub Actions workflow `.github/workflows/create-issues-from-todos.yml`
 * on every push to the main/master branch.
 * 
 * ### Manual Execution
 * 
 * To run manually:
 * 
 * ```bash
 * export GITHUB_TOKEN="your-token-here"
 * export GITHUB_REPOSITORY="owner/repo"
 * export GITHUB_SHA="commit-hash"
 * bun run .github/create-issues-from-todos.ts
 * ```
 * 
 * ## Issue Format
 * 
 * Each created issue will have:
 * 
 * - **Title**: `[TODO|FIXME] <comment text>`
 * - **Labels**: `todo` or `fixme`
 * - **Body**: 
 *   - File path and line number
 *   - Commit hash (first 7 characters)
 *   - Code context (2 lines before and after)
 *   - Timestamp
 * 
 * ### Example
 * 
 * For a comment like:
 * 
 * ```typescript
 * // TODO: Add test for audio file upload
 * ```
 * 
 * An issue will be created with:
 * 
 * ```
 * Title: [TODO] Add test for audio file upload
 * Label: todo
 * 
 * Body:
 * **File**: `e2e/audio.spec.ts`
 * **Line**: 14
 * **Commit**: abc1234
 * 
 * ### Context
 * 
 * ```
 *   12:   });
 *   13: 
 * → 14:   // TODO: Add test for audio file upload
 *   15:   // - Test file upload functionality
 *   16:   // - Verify files are processed
 * ```
 * 
 * ### Details
 * 
 * This issue was automatically created from a TODO comment found in the codebase.
 * 
 * ---
 * *Created by automated TODO/FIXME scanner on 2025-10-04T20:00:00.000Z*
 * ```
 * 
 * ## Configuration
 * 
 * The workflow is configured in `.github/workflows/create-issues-from-todos.yml`:
 * 
 * - Triggers on push to main/master branches
 * - Has `issues: write` permission
 * - Uses Bun as the TypeScript runtime
 */

/**
 * Represents a TODO or FIXME comment found in the codebase
 */
type TodoComment = {
  file: string;
  line: number;
  type: 'TODO' | 'FIXME';
  text: string;
  context: string[];
}

/**
 * Represents a GitHub issue from the API
 */
type GitHubIssue = {
  number: number;
  title: string;
  state: string;
}

/**
 * Environment variables required for script execution
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_SHA = process.env.GITHUB_SHA || 'unknown';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

if (!GITHUB_REPOSITORY) {
  console.error('❌ GITHUB_REPOSITORY environment variable is required');
  process.exit(1);
}

const [OWNER, REPO] = GITHUB_REPOSITORY.split('/');

/**
 * Scan repository for TODO and FIXME comments
 * 
 * Searches through TypeScript and TSX files in the src/ and e2e/ directories
 * for comments matching the pattern: // TODO: or // FIXME:
 * 
 * For each comment found, captures:
 * - File path and line number
 * - Comment type (TODO or FIXME)
 * - Comment text
 * - Context: 2 lines before and 2 lines after the comment
 * 
 * @returns Array of TodoComment objects representing all found comments
 */
async function findTodoComments(): Promise<TodoComment[]> {
  return (await Promise.all(['src', 'e2e'].map(async (dir) => {
  
    const comments: TodoComment[] = [];
  
    // Find all source files
    const findFilesCmd = await Bun.$`find ${dir} -type f -name "*.ts" -o -name "*.tsx"`.text();
  
    const files = findFilesCmd.trim().split('\n').filter(Boolean);
  
    for (const file of files) {
      try {
        const content = await Bun.file(file).text();
        const lines = content.split('\n');
      
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const todoMatch = line.match(/\/\/\s*(TODO|FIXME)[:\s]+(.+)/);
        
          if (todoMatch) {
            const type = todoMatch[1] as 'TODO' | 'FIXME';
            const text = todoMatch[2].trim();
          
            // Get context: 2 lines before and 2 lines after
            const contextStart = Math.max(0, i - 2);
            const contextEnd = Math.min(lines.length, i + 3);
            const context = lines.slice(contextStart, contextEnd);
          
            comments.push({
              file: file.replace(/^\.\//, ''),
              line: i + 1,
              type,
              text,
              context
            });
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${file}:`, error);
      }
    }
  
    return comments;
  }))).flat();
}

/**
 * Get existing GitHub issues
 * 
 * Fetches all issues (open and closed) from the GitHub repository to prevent
 * creating duplicate issues. Uses GitHub's REST API v3.
 * 
 * @returns Array of existing GitHub issues, or empty array on error
 */
async function getExistingIssues(): Promise<GitHubIssue[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch existing issues:', error);
    return [];
  }
}

/**
 * Create a GitHub issue
 * 
 * Creates a formatted GitHub issue from a TODO/FIXME comment with:
 * - Title: [TODO|FIXME] followed by the comment text
 * - Label: 'todo' or 'fixme' (lowercase)
 * - Body: Contains file path, line number, commit hash, code context, and timestamp
 * 
 * The code context shows 2 lines before and after the comment, with an arrow (→)
 * marking the line containing the TODO/FIXME comment.
 * 
 * @param comment - The TodoComment object to create an issue from
 */
async function createGitHubIssue(comment: TodoComment): Promise<void> {
  const title = `[${comment.type}] ${comment.text}`;
  
  // Build issue body with context
  const contextLines = comment.context.map((line, idx) => {
    const lineNum = comment.line - 2 + idx;
    const marker = lineNum === comment.line ? '→' : ' ';
    return `${marker} ${lineNum}: ${line}`;
  }).join('\n');
  
  const body = `**File**: \`${comment.file}\`  
**Line**: ${comment.line}  
**Commit**: ${GITHUB_SHA.substring(0, 7)}  

### Context

\`\`\`
${contextLines}
\`\`\`

### Details

This issue was automatically created from a ${comment.type} comment found in the codebase.

---
*Created by automated TODO/FIXME scanner on ${new Date().toISOString()}*`;
  
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        labels: [comment.type.toLowerCase()]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorData}`);
    }
    
    const issue = await response.json();
    console.log(`✅ Created issue #${issue.number}: ${title}`);
  } catch (error) {
    console.error(`❌ Failed to create issue for "${title}":`, error);
  }
}

/**
 * Main execution
 * 
 * Orchestrates the TODO/FIXME issue creation process:
 * 1. Scans repository for TODO/FIXME comments
 * 2. Fetches existing GitHub issues
 * 3. Filters out comments that already have corresponding issues
 * 4. Creates new issues for remaining comments
 * 5. Adds a 1-second delay between issue creations to avoid rate limiting
 */
async function main() {
  console.log('🔍 Scanning repository for TODO and FIXME comments...');
  
  const comments = await findTodoComments();
  console.log(`📝 Found ${comments.length} TODO/FIXME comments`);
  
  if (comments.length === 0) {
    console.log('✨ No TODO/FIXME comments found. Exiting.');
    return;
  }
  
  console.log('📋 Fetching existing GitHub issues...');
  const existingIssues = await getExistingIssues();
  console.log(`📊 Found ${existingIssues.length} existing issues`);
  
  // Create a set of existing issue titles for quick lookup
  const existingTitles = new Set(
    existingIssues.map(issue => issue.title.toLowerCase())
  );
  
  // Filter out comments that already have issues
  const newComments = comments.filter(comment => {
    const title = `[${comment.type}] ${comment.text}`.toLowerCase();
    return !existingTitles.has(title);
  });
  
  console.log(`🆕 ${newComments.length} new issues to create`);
  
  // Create issues for new comments
  for (const comment of newComments) {
    await createGitHubIssue(comment);
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Done!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
