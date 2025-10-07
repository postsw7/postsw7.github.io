#!/usr/bin/env node
// Sync jgrep web-demo artifacts from sibling repo into this portfolio's public/jgrep for local dev.
// Usage: npm run sync:jgrep (after ensuring json-grep repo path)
import { cpSync, mkdirSync, existsSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Assume sibling directory structure; allow override via env JGREP_REPO
const repoRoot = process.env.JGREP_REPO || join(__dirname, '..', '..', 'build-my-own-x', 'json-grep')
const srcDir = join(repoRoot, 'web-demo')
const destDir = join(__dirname, '..', 'public', 'jgrep')

function main() {
  if (!existsSync(srcDir)) {
    console.error('[sync-jgrep] source directory not found:', srcDir)
    process.exit(1)
  }
  mkdirSync(destDir, { recursive: true })
  const files = ['engine_min.py', 'worker.js', 'sample.jsonl']
  for (const f of files) {
    const from = join(srcDir, f)
    if (!existsSync(from)) {
      console.warn('[sync-jgrep] missing file:', from)
      continue
    }
    cpSync(from, join(destDir, f), { recursive: false })
  }
  // Generate a local version.json for cache busting
  const version = { commit: 'local-dev', ts: new Date().toISOString() }
  writeFileSync(join(destDir, 'version.json'), JSON.stringify(version, null, 2))
  console.log('[sync-jgrep] copied demo files to', destDir)
}

main()
