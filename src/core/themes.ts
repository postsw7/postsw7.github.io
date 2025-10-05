export interface Theme {
  name: string
  bg: string
  terminalBg: string
  headerBg: string
  fg: string
  accent: string
  secondary: string
  tertiary: string
  link: string
  error: string
  caret: string
  prompt: string
}

export const THEMES: Record<string, Theme> = {
  siwoo: {
    name: 'Siwoo (Default)',
    bg: 'bg-[#30353a]',
    terminalBg: 'bg-[#181b23]',
    headerBg: 'bg-[#d9e4ef]',
    fg: 'text-[#ffffff]',
    accent: 'text-[#00b2ff]',
    secondary: 'text-[#ff0096]',
    tertiary: 'text-[#fff292]',
    link: 'text-[#4285f4]',
    error: 'text-[#e75448]',
    caret: 'bg-[#ffffff]',
    prompt: 'Siwoo@Lee:~$',
  },
  light: {
    name: 'Light',
    bg: 'bg-gray-50',
    terminalBg: 'bg-white',
    headerBg: 'bg-gray-100',
    fg: 'text-gray-900',
    accent: 'text-blue-600',
    secondary: 'text-pink-600',
    tertiary: 'text-amber-600',
    link: 'text-blue-500',
    error: 'text-red-600',
    caret: 'bg-gray-900',
    prompt: 'siwoo@web:~$',
  },
  dracula: {
    name: 'Dracula',
    bg: 'bg-[#282a36]',
    terminalBg: 'bg-[#1e1f29]',
    headerBg: 'bg-[#1a1b26]',
    fg: 'text-[#f8f8f2]',
    accent: 'text-[#50fa7b]',
    secondary: 'text-[#ff79c6]',
    tertiary: 'text-[#f1fa8c]',
    link: 'text-[#8be9fd]',
    error: 'text-[#ff5555]',
    caret: 'bg-[#f8f8f2]',
    prompt: 'dracula@terminal:~$',
  },
}

export function getTheme(key: string): Theme { return THEMES[key] || THEMES.siwoo }
export function getThemeKeys(): string[] { return Object.keys(THEMES) }
export function isValidTheme(key: string): boolean { return key in THEMES }
