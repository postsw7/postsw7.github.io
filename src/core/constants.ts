export interface LinkAliases {
  github: string
  linkedin: string
  resume: string
  [k: string]: string
}

export interface DemoSpec { key: string; name: string; desc: string }

export const RESUME_URL: string = 'https://drive.google.com/file/d/1KJOa1roms-1TSyGNhXwMjDZ7BgPzedGv/view'

export const LINK_ALIASES: LinkAliases = {
  github: 'https://github.com/postsw7',
  linkedin: 'https://www.linkedin.com/in/siwoolee',
  resume: RESUME_URL,
}

export const SOCIAL_LINKS: { key: string; label: string; url: string }[] = [
  { key: 'linkedin', label: 'linkedin', url: LINK_ALIASES.linkedin },
  { key: 'github', label: 'github', url: LINK_ALIASES.github },
  { key: 'email', label: 'email', url: 'mailto:postsw7@gmail.com' },
]

export const DEMOS: DemoSpec[] = [
  { key: 'jgrep', name: 'jgrep', desc: 'JSON-Grep interactive tool (coming soon)' },
]

export function listDemoKeys(): string[] {
  return DEMOS.map(d => d.key)
}
