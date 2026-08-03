/**
 * scripts/todo.ts
 *
 * Scans the project source files for TODO comments and prints each one with
 * its file path and line number — so you can review all outstanding work
 * without leaving the terminal.
 *
 * Usage:
 *   npm run todo
 *   # or directly:
 *   npx ts-node --project tsconfig.scripts.json scripts/todo.ts
 *
 * Scanned extensions: .ts  .tsx  .js  .jsx  .md  .yaml  .yml  .css
 * Excluded directories: node_modules  .next  .git  .swc  .scripts-out
 */

import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT_DIR = path.join(__dirname, '..')

const INCLUDE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.md',
  '.yaml',
  '.yml',
  '.css',
])

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.swc',
  '.scripts-out',
])

/** This script excludes itself to avoid matching its own source text. */
const SELF_PATH = path.resolve(__filename)

/**
 * Matches a TODO marker that appears in a comment or annotation context:
 * the line must contain a comment-like prefix (// # <!-- /* *) before the
 * TODO keyword.  Captures any trailing message after an optional colon.
 */
const TODO_PATTERN = /(?:\/\/|#|<!--|\/\*|\*)\s*\bTODO\b(?::?\s*(.*))?/i

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TodoEntry = {
  file: string
  line: number
  text: string
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

function walkDir(dir: string, results: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkDir(fullPath, results)
    } else if (
      entry.isFile() &&
      INCLUDE_EXTENSIONS.has(path.extname(entry.name)) &&
      path.resolve(fullPath) !== SELF_PATH
    ) {
      results.push(fullPath)
    }
  }
}

// ---------------------------------------------------------------------------
// TODO scanner
// ---------------------------------------------------------------------------

function scanFile(filePath: string): TodoEntry[] {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const todos: TodoEntry[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = TODO_PATTERN.exec(lines[i])
    if (match) {
      todos.push({
        file: path.relative(ROOT_DIR, filePath),
        line: i + 1, // 1-based
        text: (match[1] ?? '').trim(),
      })
    }
  }

  return todos
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const files: string[] = []
  walkDir(ROOT_DIR, files)

  const allTodos: TodoEntry[] = []
  for (const file of files) {
    allTodos.push(...scanFile(file))
  }

  if (allTodos.length === 0) {
    console.log('\u2705  No TODOs found \u2014 the codebase is clean!')
    return
  }

  console.log(`\uD83D\uDCCB  Found ${allTodos.length} TODO${allTodos.length === 1 ? '' : 's'}:\n`)

  // Group by file for readability
  const byFile = new Map<string, TodoEntry[]>()
  for (const todo of allTodos) {
    const existing = byFile.get(todo.file)
    if (existing) {
      existing.push(todo)
    } else {
      byFile.set(todo.file, [todo])
    }
  }

  for (const [file, todos] of byFile) {
    console.log(`  \uD83D\uDCC4  ${file}`)
    for (const todo of todos) {
      const lineLabel = String(todo.line).padStart(4, ' ')
      const message = todo.text ? `  ${todo.text}` : ''
      console.log(`       line ${lineLabel}:${message}`)
    }
    console.log()
  }

  console.log(
    `Total: ${allTodos.length} TODO${allTodos.length === 1 ? '' : 's'} across ${byFile.size} file${byFile.size === 1 ? '' : 's'}.`,
  )
}

main()
