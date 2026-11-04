import { RESUME_URL, LINK_ALIASES } from './constants'

export interface RecruiterLink {
  label: string
  url: string
  type: 'resume' | 'linkedin' | 'github' | 'email'
}
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
  location: 'Seoul, South Korea (open to relocation) • Canadian citizen',
  experience: '9 years of experience',
  tagline: 'AWS infrastructure • CI/CD automation • Production reliability',
  highlights: [
    'Replaced all standing AWS credentials with OIDC for every GitHub Actions workflow, per-service IAM roles, and AWS Identity Center.',
    'Drove Terraform adoption from legacy Ansible with a dedicated infrastructure repo and CI checks for provider versioning.',
    'Rebuilt production deploys as one GitHub Actions pipeline that releases the frontend only after the API is live.',
    'Built a Redis-backed distributed circuit breaker to reroute chat traffic from unhealthy AI providers across ECS tasks.',
    'Traced stuck export tasks to zombie Chromium processes under a non-init PID 1 and fixed it at the container level.',
    'Led security incident response from anomalous CloudTrail activity; added real-time detection with EventBridge, GuardDuty, and PagerDuty.',
  ],
  links: [
    { label: 'Resume', url: RESUME_URL, type: 'resume' },
    { label: 'LinkedIn', url: LINK_ALIASES.linkedin, type: 'linkedin' },
    { label: 'GitHub', url: LINK_ALIASES.github, type: 'github' },
    { label: 'Email', url: 'mailto:postsw7@gmail.com', type: 'email' },
  ],
}
