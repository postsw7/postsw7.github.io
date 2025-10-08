// Simple virtual file system with directories and files

export type FSNode = string | Directory
export interface Directory { [name: string]: FSNode }

export const FS: Directory = {
  'README.md': `Welcome!\n\nUse 'cd profile' to view profile files, and 'cd projects/jgrep' for the demo.`,
  profile: {
    'about.md': `# Siwoo Lee\nToronto-based Software Engineer. Started in frontend through a coding bootcamp, grew into full-stack and DevOps roles, and later earned a CS degree to formalize what I’d been doing in practice.\n\n## Quick Start\nType 'help' for available commands.\nTry 'show recruiter' to see a short card.\nTry 'run demo jgrep' to explore the JSON-friendly grep demo.\n\n## About\nI enjoy working with great people and a healthy engineering culture.\nI value maintainability, collaboration, and clarity.\nIf you want the deeper story, check 'experience.md' or 'skills.md'.`,
    'experience.md': `# Experience (Highlights)\n\n## Venngage — Site Reliability Support, Part-time (2025– )\n- On-call rotations via PagerDuty/CloudWatch; tuned alerts and created runbooks for recurring incidents.\n\n## Venngage — Software Engineer (2019–2025, Toronto)\n- Led security hardening: IAM audit, removal of static access keys, MFA for engineers; added GuardDuty/EventBridge monitoring.\n- Modernized auth and delivery: moved to AWS Identity Center, refreshed GitHub Actions + ECS pipelines.\n- Built a Python CLI for template data migration (AWS Secrets Manager, dry-run/rollback) — cut ops time from hours to minutes.\n- Shipped a Strapi-based CMS (Aurora MySQL, CloudFormation, Docker) and contributed React/TS features in the editor.\n\n## Level 13 — Frontend Engineer (2017–2019, Seoul)\n- Built e-commerce “Lookpin” from scratch (React/Redux); performance-focused frontend, price comparison features.\n- Maintained CRM in Rails/jQuery; reduced load time and improved product update workflows.\n\n## Education & Award\n- B.S. Computer Science — Western Governors University\n- Winner — AWS Startup Canada Security GameDay (2021)\n\nFor full details, type 'linkedin'.`,
    'skills.md': `# Skills\n\n- Languages: TypeScript/JavaScript, Python, PHP\n- Frameworks: React, Next.js, Strapi, Vite, Chakra UI, Tailwind, Ruby on Rails, jQuery\n- Technologies: Node.js, AWS, Git, Docker, GitHub Actions, Ansible, Netlify, Vercel, Algolia, Google Tag Manager`,
    'contact.md': `# Contact\n\n- Email: postsw7@gmail.com\n- LinkedIn: https://www.linkedin.com/in/siwoolee/\n- GitHub: https://github.com/postsw7\n\nIf you're hiring: I'm actively looking for roles in San Francisco and open to relocate. Reach out on LinkedIn or email.`,
  },
  projects: {
    jgrep: {
      'README.md': `# JSON-Grep\n\nAn interactive JSON log filtering and extraction demo showcasing regex, key-based search, pretty printing, and table extraction. Use 'run demo jgrep' to step through features.`,
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
