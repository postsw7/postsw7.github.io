// Simple virtual file system with directories and files

export type FSNode = string | Directory
export interface Directory {
  [name: string]: FSNode
}

export const FS: Directory = {
  'README.md': `Welcome!\n\nUse 'cd profile' to view profile files, and 'cd projects/jgrep' for the demo.`,
  profile: {
    'about.md': `# Siwoo Lee\nSoftware Engineer based in Seoul, with 9 years of experience building and operating production systems on AWS. Started in frontend through a coding bootcamp, grew into full-stack and DevOps roles, and later earned a CS degree to formalize what I’d been doing in practice.\n\n## Quick Start\nType 'help' for available commands.\nTry 'whoami' to see who I am.\nTry 'run demo jgrep' to explore the JSON-friendly grep demo.\n\n## About\nI enjoy working with great people and a healthy engineering culture.\nI value maintainability, collaboration, and clarity.\nIf you want the deeper story, check 'experience.md' or 'skills.md'.`,
    'experience.md': `# Experience\n\n## Venngage, Toronto (Jul 2019 – Oct 2026)\n\nSenior Software Engineer (May 2026 – Oct 2026)\n- Rebuilt production deploys as one GitHub Actions pipeline that releases the frontend only after the API is live, retiring 3 legacy workflows.\n- Built a Redis-backed distributed circuit breaker to reroute chat traffic from unhealthy AI providers, coordinating recovery across ECS tasks with a single-flight probe lock; measured overhead under 1% of request latency.\n- Traced stuck export tasks, which kept accepting requests they could no longer serve, to zombie Chromium processes under a non-init PID 1; fixed the issue at the container level, as more memory and CPU would only delay the failures.\n- Reconciled AI usage against 5 providers' invoices, shipped a per-action cost ledger, and built the cost-based credit engine on it in Node.js, TypeScript, and PostgreSQL.\n\nDevOps & Infrastructure Engineer, Contract (May 2025 – Apr 2026)\n- Drove Terraform adoption from legacy Ansible by identifying state and auditability gaps, establishing a dedicated infrastructure repository, and adding CI checks for consistent provider versioning.\n- Designed an event-driven template sync pipeline using PHP, SQS, Lambda, and S3 to automate staging refreshes across 3 databases, eliminating recurring manual engineer involvement.\n- Architected split DNS with Route 53 private hosted zones to route ~500k daily internal requests through the private network, reducing WAF noise and surfacing real external traffic patterns.\n\nSenior Software Engineer (Dec 2021 – Apr 2025)\n- Replaced all standing AWS credentials in production and staging operations by extending OIDC to every GitHub Actions workflow with per-service IAM roles and moving programmatic access to AWS Identity Center.\n- Led security incident response after detecting anomalous CloudTrail activity: audited IAM, revoked and rotated exposed credentials, and added real-time detection with EventBridge, GuardDuty, and PagerDuty.\n- Accelerated content updates 7x with a Strapi CMS on Aurora MySQL and CloudFormation, including automated multi-locale propagation through DeepL plugins.\n\nSoftware Engineer (Jul 2019 – Dec 2021)\n- Moved into the infrastructure team and built SES delivery tracking with CloudWatch, a more reliable multi-page PowerPoint export flow with S3 and SQS, and WAF rules to block bot and scraper traffic.\n- Delivered full-stack features across the editor and platform in React, TypeScript, and PHP, including image delivery optimization with S3, CloudFront, and Lambda@Edge.\n\n## Level 13, Seoul (Jul 2017 – Apr 2019)\n\nFrontend Engineer\n- Built the web version of Lookpin, previously a mobile-only service, using React and Redux; the site accounted for 10% of company traffic in its first quarter and achieved a Lighthouse performance score of 97.\n\n## Education & Award\n- B.S. Computer Science, Western Governors University (Aug 2025)\n- Winner, AWS Startup Canada Security Game Day (Mar 2021): led team to 1st place in cloud-native security and infrastructure challenges across VPC, S3, WAF, RDS, and EC2.\n\nFor the full resume, type 'resume'.`,
    'skills.md': `# Skills\n\n- Cloud & Infrastructure: AWS (VPC, IAM, EC2, ECS, RDS, S3, Route 53, CloudFront, Lambda, SES, SQS, WAF, Athena, Security Hub, GuardDuty, Secrets Manager)\n- IaC & CI/CD: Terraform, CloudFormation, Ansible, Docker, GitHub Actions\n- Operations & Observability: Linux, CloudWatch, CloudTrail, EventBridge, PagerDuty\n- Languages & Scripting: JavaScript, TypeScript, Python, PHP, SQL, Bash\n- Frameworks & Databases: React, Node.js, MySQL, PostgreSQL, Aurora, Redis`,
    'contact.md': `# Contact\n\n- Email: postsw7@gmail.com\n- LinkedIn: https://www.linkedin.com/in/siwoolee/\n- GitHub: https://github.com/postsw7\n\nIf you're hiring: I'm actively looking for my next role, based in Seoul and open to relocation. Reach out on LinkedIn or email.`,
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
export function isFile(node: FSNode | null | undefined): node is string {
  return typeof node === 'string'
}

export function normalizePath(cwdArr: string[], input?: string) {
  if (!input || input === '~') return [] as string[]
  const parts = input.startsWith('/') ? input.slice(1).split('/') : [...cwdArr, ...input.split('/')]
  const out: string[] = []
  for (const p of parts) {
    if (!p || p === '.') continue
    if (p === '..') out.pop()
    else out.push(p)
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

export interface VFSEntry {
  name: string
  type: 'dir' | 'file'
}

export function list(fs: Directory, cwdArr: string[], pathInput?: string): VFSEntry[] | null {
  const targetArr = normalizePath(cwdArr, pathInput || '.')
  const node = getNode(fs, targetArr)
  if (!node || !isDir(node)) return null
  return Object.keys(node).map((name) => ({
    name,
    type: isDir((node as Directory)[name]) ? 'dir' : 'file',
  }))
}

export function read(fs: Directory, cwdArr: string[], pathInput: string): string | null {
  const targetArr = normalizePath(cwdArr, pathInput)
  const node = getNode(fs, targetArr)
  if (isFile(node)) return node
  return null
}

export function pathLabel(cwdArr: string[]) {
  return cwdArr.length ? '~/' + cwdArr.join('/') : '~'
}
