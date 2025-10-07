export interface HelpItem { cmd: string; desc: string }
export interface HelpSection { title: string; items: HelpItem[] }

export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Navigation',
    items: [
      { cmd: 'help', desc: 'Show this help message' },
      { cmd: 'clear', desc: 'Clear the terminal' },
      { cmd: 'pwd', desc: 'Print current directory' },
      { cmd: 'ls [path]', desc: 'List directory entries' },
      { cmd: 'cd <path>', desc: 'Change directory (use cd .. for parent, Tab to drill into subdirs)' },
    ],
  },
  {
    title: 'Files',
    items: [
      { cmd: 'cat <file>', desc: 'Display file contents (try: cat README.md)' },
      { cmd: 'profile/*', desc: 'Profile files: about.md, skills.md, experience.md, contact.md' },
    ],
  },
  {
    title: 'Special',
    items: [
      { cmd: 'show recruiter', desc: 'View recruiter card' },
      { cmd: 'open <github|linkedin|resume>', desc: 'Open quick links' },
      { cmd: 'theme <name>', desc: 'Change theme (siwoo, light, dracula)' },
    ],
  },
  {
    title: 'Projects',
    items: [
      { cmd: 'run demo list', desc: 'List available demos' },
      { cmd: 'cd projects/jgrep', desc: 'Navigate to JSON-Grep project' },
    ],
  },
]

export const HELP_FOOTER = "Tip: Use Tab for autocomplete, ↑↓ for history, Ctrl+C to cancel"
