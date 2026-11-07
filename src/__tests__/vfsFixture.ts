import type { Directory } from '../core/vfs'

// Adds a test-only 'pro*' sibling of profile/ so ambiguous path completion stays covered
// regardless of what the real site ships at the root.
export function withSampleProjects<T extends { FS: Directory }>(actual: T): T {
  return {
    ...actual,
    FS: { ...actual.FS, projects: { sample: { 'README.md': '# Sample Project' } } },
  }
}
