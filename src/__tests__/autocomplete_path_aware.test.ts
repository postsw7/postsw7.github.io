import { describe, it, expect, beforeEach } from 'vitest'
import { getCompletionCandidates, applyCompletion } from '../ui/autocomplete'

interface TestCmd { desc: string; handler: (...args: any[]) => void }
const registry: Record<string, TestCmd> = {
  help: { desc: '', handler: () => {} },
  clear: { desc: '', handler: () => {} },
  pwd: { desc: '', handler: () => {} },
  cd: { desc: '', handler: () => {} },
  ls: { desc: '', handler: () => {} },
  cat: { desc: '', handler: () => {} },
  open: { desc: '', handler: () => {} },
}

describe('path-aware autocomplete (VFS-backed)', () => {
  beforeEach(() => {
    (globalThis as any).__CLI_CWD__ = []
  })

  it('cd <Tab> suggests root directories', () => {
    const cands = getCompletionCandidates(['cd'], true, registry)
    expect(cands).toEqual(expect.arrayContaining(['profile/', 'projects/']))
  })

  it('ls <Tab> in root suggests root entries', () => {
    const cands = getCompletionCandidates(['ls'], true, registry)
    expect(cands).toEqual(expect.arrayContaining(['README.md', 'profile/', 'projects/']))
  })

  it('ls <Tab> in /profile suggests only profile files', () => {
  (globalThis as any).__CLI_CWD__ = ['profile']
    const cands = getCompletionCandidates(['ls'], true, registry)
    expect(cands).toEqual(expect.arrayContaining(['about.md', 'skills.md', 'experience.md', 'contact.md']))
    expect(cands).not.toEqual(expect.arrayContaining(['README.md', 'projects/']))
  })

  it('cd pro<Tab> returns both profile/ and projects/ (ambiguous)', () => {
    const cands = getCompletionCandidates(['cd', 'pro'], false, registry)
    expect(cands).toEqual(expect.arrayContaining(['projects/', 'profile/']))
    expect(cands).toHaveLength(2)
  })

  it('cat R<Tab> in root completes to README.md (files only)', () => {
    const cands = getCompletionCandidates(['cat', 'R'], false, registry)
    expect(cands).toEqual(['README.md'])
  })

  it('apply after "cd " should append candidate, not overwrite command', () => {
    const cands = getCompletionCandidates(['cd'], true, registry)
    const dir = cands.includes('projects/') ? 'projects/' : cands[0]
    const next = applyCompletion('cd ', dir)
    expect(next).toMatch(/^cd (projects|profile)\//)
  })
})
