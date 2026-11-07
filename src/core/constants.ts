export interface LinkAliases {
  github: string
  linkedin: string
  resume: string
  [k: string]: string
}

export const RESUME_URL: string =
  'https://drive.google.com/file/d/1OUs9tj3a8xnCxUUup6ocWKzBL8TrJiRl/view?usp=sharing'

export const LINK_ALIASES: LinkAliases = {
  github: 'https://github.com/postsw7',
  linkedin: 'https://www.linkedin.com/in/siwoolee/',
  resume: RESUME_URL,
}

export const SOCIAL_LINKS: { key: string; label: string; url: string }[] = [
  { key: 'linkedin', label: 'linkedin', url: LINK_ALIASES.linkedin },
  { key: 'github', label: 'github', url: LINK_ALIASES.github },
  { key: 'email', label: 'email', url: 'mailto:postsw7@gmail.com' },
]
