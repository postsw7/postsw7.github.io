import { describe, it, expect, beforeEach } from 'vitest'

import { getCompletionCandidates, applyCompletion } from '../ui/autocomplete'

// Minimal registry for testing (handlers unused)
interface TestCmd {
  desc: string
  handler: (...args: any[]) => void
}
const registry: Record<string, TestCmd> = {
  help: { desc: '', handler: () => {} },
  clear: { desc: '', handler: () => {} },
  pwd: { desc: '', handler: () => {} },
  cd: { desc: '', handler: () => {} },
  ls: { desc: '', handler: () => {} },
  cat: { desc: '', handler: () => {} },
  open: { desc: '', handler: () => {} },
  theme: { desc: '', handler: () => {} },
  run: { desc: '', handler: () => {} },
  show: { desc: '', handler: () => {} },
}

describe('autocomplete (commands + VFS)', () => {
  beforeEach(() => {
    // Simulate root directory for VFS-backed completion
    ;(globalThis as any).__CLI_CWD__ = []
  })

  // Command name basics
  it('completes command names', () => {
    const cands = getCompletionCandidates(['he'], false, registry)
    expect(cands).toEqual(['help'])
  })

  it('lists ambiguous command candidates', () => {
    const cands = getCompletionCandidates(['c'], false, registry)
    expect(cands.sort()).toEqual(['cat', 'cd', 'clear'])
    // ensure no unexpected command surfaced
    expect(cands).not.toContain('help')
  })

  it('applies completion with space after unique command', () => {
    expect(applyCompletion('he', 'help')).toBe('help ')
  })

  // Theme completions (dark/light)
  it('suggests theme names', () => {
    const cands = getCompletionCandidates(['theme', 'd'], false, registry)
    expect(cands).toEqual(['dark'])
  })

  // Path-aware directory completion
  it('cd <Tab> suggests root directories', () => {
    const cands = getCompletionCandidates(['cd'], true, registry)
    expect(cands).toEqual(expect.arrayContaining(['profile/', 'projects/']))
  })

  it('ls <Tab> in root suggests root entries including README.md', () => {
    const cands = getCompletionCandidates(['ls'], true, registry)
    expect(cands).toEqual(expect.arrayContaining(['README.md', 'profile/', 'projects/']))
  })

  it('ls <Tab> in /profile suggests only profile files', () => {
    ;(globalThis as any).__CLI_CWD__ = ['profile']
    const cands = getCompletionCandidates(['ls'], true, registry)
    expect(cands).toEqual(
      expect.arrayContaining(['about.md', 'skills.md', 'experience.md', 'contact.md']),
    )
    expect(cands).not.toEqual(expect.arrayContaining(['README.md', 'projects/']))
  })

  it('cd pro<Tab> returns both profile/ and projects/ (ambiguous)', () => {
    const cands = getCompletionCandidates(['cd', 'pro'], false, registry)
    expect(cands).toEqual(expect.arrayContaining(['projects/', 'profile/']))
    expect(cands.length).toBe(2)
  })

  it('cat R<Tab> in root completes to README.md (files only)', () => {
    const cands = getCompletionCandidates(['cat', 'R'], false, registry)
    expect(cands).toEqual(['README.md'])
  })

  it('cat profile/a<Tab> drills into profile directory and suggests about.md', () => {
    const cands = getCompletionCandidates(['cat', 'profile/a'], false, registry)
    expect(cands).toEqual(['profile/about.md'])
  })

  it('cat profile/ lists entries inside profile (relative names only)', () => {
    const cands = getCompletionCandidates(['cat', 'profile/'], false, registry)
    expect(cands).toEqual(
      expect.arrayContaining(['about.md', 'skills.md', 'experience.md', 'contact.md']),
    )
  })

  it('applyCompletion with relative name after dir prefixes it correctly', () => {
    const result = applyCompletion('cat profile/', 'about.md')
    expect(result).toMatch(/^cat profile\/about\.md/) // anchored
  })

  it('applyCompletion prefixes nested project path (cat projects/ + jgrep/)', () => {
    const result = applyCompletion('cat projects/', 'jgrep/')
    expect(result).toMatch(/^cat projects\/jgrep\//)
  })

  it('cat projects/jgrep/README.md <space> has no further completions', () => {
    const cands = getCompletionCandidates(['cat', 'projects/jgrep/README.md'], true, registry)
    expect(cands).toEqual([])
  })

  it('apply after "cd " appends directory token without overwriting command', () => {
    const cands = getCompletionCandidates(['cd'], true, registry)
    const chosen = cands.includes('projects/') ? 'projects/' : cands[0]
    const next = applyCompletion('cd ', chosen)
    expect(next).toMatch(/^cd (projects|profile)\//)
  })
})
