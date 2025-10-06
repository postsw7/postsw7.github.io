// Simple virtual file system with directories and files

export type FSNode = string | Directory
export interface Directory { [name: string]: FSNode }

export const FS: Directory = {
  'README.md': `Welcome!\n\nUse 'cd profile' to view profile files, and 'cd projects/jgrep' for the demo.`,
  profile: {
    'about.md': `# About Me\n\nToronto-based Software Engineer. Building AWS/ECS/RDS-backed web apps.`,
    'skills.md': `# Skills\n\nFrontend: React, JS, Redux, jQuery\nBackend: Rails, Node.js\nCloud: AWS (ECS, RDS, S3)`,
    'experience.md': `# Experience\n\nSole frontend engineer for Lookpin. Built e-commerce from scratch.`,
    'contact.md': `# Contact\n\nEmail: postsw7@gmail.com\nLinkedIn: https://www.linkedin.com/in/siwoolee/\nGitHub: https://github.com/postsw7`,
  },
  projects: {
    jgrep: {
      'README.md': `# JSON-Grep (placeholder)\n\nAn interactive JSON filtering tool. (Coming soon)`,
    },
  },
}

export function isDir(node: FSNode | null | undefined): node is Directory {
  return !!node && typeof node === 'object' && !Array.isArray(node)
}
export function isFile(node: FSNode | null | undefined): node is string { return typeof node === 'string' }

export function normalizePath(cwdArr: string[], input?: string) {
  if (!input || input === '~') return [] as string[]
  const parts = input.startsWith('/') ? input.slice(1).split('/') : [...cwdArr, ...input.split('/')]
  const out: string[] = []
  for (const p of parts) {
    if (!p || p === '.') continue
    if (p === '..') out.pop(); else out.push(p)
  }
  return out
}

export function getNode(fs: Directory, pathArr: string[]): FSNode | null {
  let node: FSNode = fs
  for (const seg of pathArr) {
    if (!isDir(node) || !(seg in node)) return null
    node = (node as Directory)[seg]
  }
  return node
}

export interface VFSEntry { name: string; type: 'dir' | 'file' }

export function list(fs: Directory, cwdArr: string[], pathInput?: string): VFSEntry[] | null {
  const targetArr = normalizePath(cwdArr, pathInput || '.')
  const node = getNode(fs, targetArr)
  if (!node || !isDir(node)) return null
  return Object.keys(node).map(name => ({ name, type: isDir((node as Directory)[name]) ? 'dir' : 'file' }))
}

export function read(fs: Directory, cwdArr: string[], pathInput: string): string | null {
  const targetArr = normalizePath(cwdArr, pathInput)
  const node = getNode(fs, targetArr)
  if (isFile(node)) return node
  return null
}

export function pathLabel(cwdArr: string[]) { return cwdArr.length ? '~/' + cwdArr.join('/') : '~' }
