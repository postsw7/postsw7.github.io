import { FS, list as vfsList } from '../core/vfs'

interface Entry { name: string; type: 'dir' | 'file' }
interface CommandsMap { [k: string]: any }

function cwdArray(): string[] {
  return (globalThis as any).__CLI_CWD__ || []
}

function joinPath(base: string, name: string) {
  if (!base) return name;
  return base.endsWith('/') ? base + name : base + '/' + name
}

function dirnameAndPrefix(path: string) {
  if (!path) return { dir: '', prefix: '' };
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return { dir: '', prefix: path };
  return { dir: path.slice(0, lastSlash), prefix: path.slice(lastSlash + 1) }
}

function getPathCompletions(raw: string, opts: { onlyDirs?: boolean; onlyFiles?: boolean } = {}): string[] {
  const { onlyDirs = false, onlyFiles = false } = opts
  const cwd = cwdArray()
  const input = raw || ''
  const isDirHint = input.endsWith('/')
  const baseDir = isDirHint ? input.slice(0, -1) : dirnameAndPrefix(input).dir
  const prefix = isDirHint ? '' : dirnameAndPrefix(input).prefix
  const rawEntries = vfsList(FS, cwd, baseDir || '.') || []
  const entries: Entry[] = rawEntries.map(e => ({ name: e.name, type: e.type === 'dir' ? 'dir' : 'file' as const }))
  const specialsOut: string[] = []

  const out = entries.filter(e => {
    if (onlyDirs && e.type !== 'dir') return false
    if (onlyFiles && e.type !== 'file') return false
    return !prefix || e.name.startsWith(prefix)
  }).map(e => {
    const p = baseDir ? joinPath(baseDir, e.name) : e.name
    return e.type === 'dir' ? p + '/' : p
  })

  return [...specialsOut, ...out]
}

function getSubdirectoryCompletions(dirToken: string): string[] {
  // dirToken comes from previous argument, expected to end with '/'
  if (!dirToken.endsWith('/')) return []
  const cwd = cwdArray()
  const base = dirToken.slice(0, -1) || '.'
  const entries = vfsList(FS, cwd, base) || []
  return entries
    .filter(e => e.type === 'dir')
    .map(e => dirToken + e.name + '/')
}

export function getCompletionCandidates(tokens: string[], trailingSpace: boolean, commands: CommandsMap): string[] {
  const commandNames = Object.keys(commands)

  if (tokens.length === 0) return commandNames

  if (tokens.length === 1 && !trailingSpace) {
    const prefix = tokens[0].toLowerCase();
    return commandNames.filter(cmd => cmd.startsWith(prefix))
  }

  const cmdName = tokens[0]
  const currentArg = trailingSpace ? '' : (tokens[tokens.length - 1] || '')

  if (cmdName === 'cat') return getPathCompletions(currentArg, { onlyFiles: true })
  if (cmdName === 'theme') return getThemeCompletions(currentArg)
  if (cmdName === 'run') return getRunSubcommands(tokens, trailingSpace, currentArg)
  if (cmdName === 'show') return getShowSubcommands(tokens, trailingSpace, currentArg)
  if (cmdName === 'cd') {
    // If we just completed a directory (argument ends with '/' and a space followed it), list its subdirectories only
    if (trailingSpace && tokens.length >= 2) {
      const prev = tokens[tokens.length - 1]
      if (prev.endsWith('/')) {
        const subs = getSubdirectoryCompletions(prev)
        if (subs.length === 1) {
          // Auto expand the single subdirectory (keep drilling) by replacing last token in-place.
          // We return the single completion so caller will apply it.
          return subs
        }
        return subs
      }
    }
    return getPathCompletions(currentArg, { onlyDirs: true })
  }

  if (cmdName === 'ls') {
    if (trailingSpace && tokens.length >= 2) {
      const prev = tokens[tokens.length - 1]
      if (prev.endsWith('/')) {
        const subs = getSubdirectoryCompletions(prev)
        if (subs.length === 1) return subs
        return subs
      }
    }
    return getPathCompletions(currentArg)
  }

  if (cmdName === 'open') {
    const aliases = ['github', 'linkedin', 'resume'];
    return aliases.filter(a => a.startsWith(currentArg))
  }

  return []
}

export function applyCompletion(input: string, completion: string): string {
  // If the input already ends with space, we're starting a new argument.
  // Avoid duplicating the immediately preceding token (bug: `cd jgrep/ ` + Tab => `cd jgrep/ jgrep/`).
  if (/\s$/.test(input)) {
    const tokens = input.trim().split(/\s+/)
    const last = tokens[tokens.length - 1]
    // Normalize both sides by stripping a single trailing slash for comparison.
    const norm = (v: string) => v.endsWith('/') ? v.slice(0, -1) : v
    if (last && norm(last) === norm(completion)) {
      // Already have this completion as the previous argument; do nothing.
      return input
    }
    // If completion is a directory (ends with '/'), do NOT append trailing space so we can keep drilling deeper.
    return input + completion + (completion.endsWith('/') ? '' : ' ')
  }

  const tokens = input.trim().split(/\s+/)
  if (tokens.length === 0) return completion + ' '
  tokens[tokens.length - 1] = completion
  return tokens.join(' ') + (completion.endsWith('/') ? '' : ' ')
}

function getThemeCompletions(prefix: string) { const themes = ['siwoo', 'light', 'dracula']; return themes.filter(t => t.toLowerCase().startsWith(prefix.toLowerCase())) }

function getRunSubcommands(tokens: string[], trailing: boolean, current: string) {
  const subs = ['demo']
  if (tokens.length === 1 && trailing) return subs
  if (tokens.length === 2 && !trailing) return subs.filter(s => s.startsWith(current.toLowerCase()))
  if (tokens.length >= 2 && tokens[1] === 'demo') {
    const demos = ['list', 'jgrep']
    if (tokens.length === 2 && trailing) return demos
    if (tokens.length === 3 && !trailing) return demos.filter(d => d.startsWith(current.toLowerCase()))
  }
  return []
}

function getShowSubcommands(tokens: string[], trailing: boolean, current: string) {
  const subs = ['recruiter']

  if (tokens.length === 1 && trailing) {
    return subs
  }
  if (tokens.length === 2 && !trailing) {
    return subs.filter(s => s.startsWith(current.toLowerCase()))
  }

  return []
}
