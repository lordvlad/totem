#!/usr/bin/env bun

/**
 * Script to automatically create GitHub issues from TODO and FIXME comments.
 * 
 * Features:
 * - Scans repository for TODO/FIXME comments
 * - Creates GitHub issues with context (2 lines before and after)
 * - Includes first commit hash where the comment was detected
 * - Idempotent: won't create duplicate issues (based on title)
 */

interface TodoComment {
  file: string;
  line: number;
  type: 'TODO' | 'FIXME';
  text: string;
  context: string[];
}

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
}

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
 */
async function findTodoComments(): Promise<TodoComment[]> {
  const comments: TodoComment[] = [];
  
  // Find all source files
  const findFilesCmd = await Bun.$`find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.git/*"`.text();
  
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
}

/**
 * Get existing GitHub issues
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
