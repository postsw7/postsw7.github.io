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
  experience: '7+ years experience',
  tagline: 'Full-stack engineer • AWS Cloud & DevOps automation',
  highlights: [
    'Led org-wide security infrastructure overhaul; integrated AWS Identity Center for unified auth.',
    'Modernized CI/CD with GitHub Actions & ECS; maintained legacy Ansible automation sustainably.',
    'Migrated legacy S3/SES integrations to AWS SDK with IAM-based auth.',
    'Developed Strapi-based CMS (Aurora MySQL, Docker, DeepL) — enabled non-dev updates 7× faster.',
    'Built & launched full-featured e-commerce web app (React, Redux, JS) as the sole front-end engineer.',
  ],
  links: [
    { label: 'Resume', url: RESUME_URL, type: 'resume' },
    { label: 'LinkedIn', url: LINK_ALIASES.linkedin, type: 'linkedin' },
    { label: 'GitHub', url: LINK_ALIASES.github, type: 'github' },
    { label: 'Email', url: 'mailto:postsw7@gmail.com', type: 'email' },
  ],
}
