import { RESUME_URL, LINK_ALIASES } from './constants'

export interface RecruiterLink { label: string; url: string; type: 'resume' | 'linkedin' | 'github' | 'email' }
export interface RecruiterData {
  name: string
  location: string
  experience: string
  tagline: string
  highlights: string[]
  links: RecruiterLink[]
}

export const RECRUITER: RecruiterData = {
  name: 'Siwoo Lee — Software Engineer',
  location: 'Toronto, ON, Canada',
  experience: '6+ years experience',
  tagline: 'Frontend specialist • Full-stack capable',
  highlights: [
    'Built complete e-commerce platform from scratch as sole frontend engineer',
    'Expert in React, JavaScript, Ruby on Rails, AWS (ECS, RDS, S3)',
    'Created Lookpin - price comparison shopping platform',
  ],
  links: [
    { label: '📄 Resume', url: RESUME_URL, type: 'resume' },
    { label: '💼 LinkedIn', url: LINK_ALIASES.linkedin, type: 'linkedin' },
    { label: '💻 GitHub', url: LINK_ALIASES.github, type: 'github' },
    { label: '✉️ Email', url: 'mailto:postsw7@gmail.com', type: 'email' },
  ],
}
