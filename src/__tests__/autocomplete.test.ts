import { describe, it, expect, beforeAll } from 'vitest'
import { getCompletionCandidates, applyCompletion } from '../ui/autocomplete'

interface TestCmd { desc: string; handler: (...args: any[]) => void }
const registry: Record<string, TestCmd> = {
  help: { desc: '', handler: () => {} },
  clear: { desc: '', handler: () => {} },
  cat: { desc: '', handler: () => {} },
  open: { desc: '', handler: () => {} },
  theme: { desc: '', handler: () => {} },
  run: { desc: '', handler: () => {} },
  show: { desc: '', handler: () => {} },
}

beforeAll(() => {
  (globalThis as any).__CLI_FILES__ = ['README.md', 'contact.md', 'skills.md', 'experience.md']
})

describe('autocomplete', () => {
  it('completes command names', () => {
    expect(getCompletionCandidates(['he'], false, registry)).toEqual(['help'])
  })

  it('lists candidates when ambiguous', () => {
    const cands = getCompletionCandidates(['c'], false, registry)
    expect(cands.sort()).toEqual(['cat', 'clear'])
  })

  it('completes files for cat', () => {
    const cands = getCompletionCandidates(['cat', 'R'], false, registry)
    expect(cands).toEqual(['README.md'])
  })

  it('applies completion with space', () => {
    expect(applyCompletion('he', 'help')).toBe('help ')
  })
})
