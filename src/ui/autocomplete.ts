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
  const specials = ['.', '..']
  const specialsOut: string[] = []

  for (const s of specials) {
    if (onlyFiles) continue
    if (!prefix || s.startsWith(prefix)) {
      const p = baseDir ? joinPath(baseDir, s) : s
      specialsOut.push(p + '/')
    }
  }

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
  if (cmdName === 'cd') return getPathCompletions(currentArg, { onlyDirs: true })
  if (cmdName === 'ls') return getPathCompletions(currentArg)
  if (cmdName === 'open') {
    const aliases = ['github', 'linkedin', 'resume'];
    return aliases.filter(a => a.startsWith(currentArg))
  }

  return []
}

export function applyCompletion(input: string, completion: string): string {
  if (/\s$/.test(input)) return input + completion + ' '
  const tokens = input.trim().split(/\s+/)
  if (tokens.length === 0) return completion + ' '
  tokens[tokens.length - 1] = completion
  return tokens.join(' ') + ' '
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
