// ============================================================================
// CLI Component - Interactive Terminal
// ============================================================================
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { getTheme } from '../core/themes'
import { tokenize, hasTrailingSpace } from '../core/tokenize'
import { trackVisit, trackCommand, trackUnknownCommand } from '../core/analytics'
import { createRegistry } from '../commands/registry'
import { FS, list as vfsList, read as vfsRead, normalizePath, getNode, isDir, pathLabel } from '../core/vfs'
import { getCompletionCandidates, applyCompletion } from './autocomplete'
import { CommandRow } from './components/CommandRow'
import { ActivePrompt } from './components/ActivePrompt'

// Basic types for output items
interface CommandMeta { status: Status; branch: string; time: string }
export type Status = 'ok' | 'int' | 'err'
interface BaseItem { id: string | number }
interface CommandItem extends BaseItem { type: 'command'; prompt: string; content: string; meta: CommandMeta }
interface OutputItem extends BaseItem { type: 'output'; content: React.ReactNode }
interface ErrorItem extends BaseItem { type: 'error'; content: React.ReactNode }
interface InfoItem extends BaseItem { type: 'info'; content: React.ReactNode }

type LineItem = CommandItem | OutputItem | ErrorItem | InfoItem

interface SuggestionState { list: string[]; index: number; baseInput: string }

export function CLI(): JSX.Element {
  const [themeKey, setThemeKey] = useState('siwoo')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cwd, setCwd] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [output, setOutput] = useState<LineItem[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionState | null>(null)
  const [activeStatus, setActiveStatus] = useState<Status>('ok')

  const inputRef = useRef<HTMLInputElement | null>(null)
  const outputEndRef = useRef<HTMLDivElement | null>(null)
  const theme = getTheme(themeKey)

  // Track visit + welcome
  useEffect(() => {
  trackVisit()
  try { (globalThis as any).__CLI_CWD__ = cwd } catch (e) { /* no-op */ }
    addOutput({ type: 'output', content: (
      <div className="space-y-2">
        <div className="text-lg font-bold text-[#00ffa6]">Welcome to Siwoo Lee&apos;s Portfolio! 🚀</div>
        <div>Type <span className="text-[#00ffa6]">help</span> to see available commands.</div>
        <div className="text-sm text-gray-400">Tip: Use ↑↓ for history, Tab for autocomplete, Ctrl+C to cancel</div>
      </div>
    ) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { outputEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [output])
  useEffect(() => { try { (globalThis as any).__CLI_CWD__ = cwd } catch (e) { /* ignore */ } }, [cwd])
  useEffect(() => { const h = () => inputRef.current?.focus(); document.addEventListener('click', h); return () => document.removeEventListener('click', h) }, [])

  const api = {
    echo: (content: React.ReactNode) => addOutput({ type: 'output', content }),
    clear: () => setOutput([]),
    setTheme: (key: string) => setThemeKey(key),
    files: {},
  }
  const commands = createRegistry(api, theme.prompt)

  // Overloads for stronger type inference
  function addOutput(item: Omit<CommandItem, 'id'>): string
  function addOutput(item: Omit<OutputItem, 'id'>): string
  function addOutput(item: Omit<ErrorItem, 'id'>): string
  function addOutput(item: Omit<InfoItem, 'id'>): string
  function addOutput(item: Omit<LineItem, 'id'>): string {
    const id = (Date.now() + Math.random()).toString()
    setOutput(prev => [...prev, { ...(item as any), id } as LineItem])
    return id
  }

  function finalizeCommand(_commandId: string | number, status: Status) { setActiveStatus(status) }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'l' || e.key === 'L') && e.ctrlKey) {
      e.preventDefault()
      setOutput([])
      return
    }

    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()

      const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      addOutput({
        type: 'command',
        prompt: `${theme.prompt.replace('~$', pathLabel(cwd) + '$')}`,
        content: (input || '') + '^C',
        meta: { status: activeStatus, branch: 'base', time: timeLabel }
      })
      setInput('')
      setSuggestions(null)
      setHistoryIndex(-1)
      setActiveStatus('int')

      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()

      if (!history.length) return

      const ni = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)

      setHistoryIndex(ni)
      setInput(history[ni])

      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()

      if (historyIndex === -1) return

      const ni = historyIndex + 1

      if (ni >= history.length) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(ni)
        setInput(history[ni])
      }

      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()

      if (suggestions && suggestions.list.length > 1) {
        const dir = e.shiftKey ? -1 : 1
        const len = suggestions.list.length
        const nextIndex = (suggestions.index + dir + len) % len
        const completed = applyCompletion(suggestions.baseInput, suggestions.list[nextIndex])
        setSuggestions({ ...suggestions, index: nextIndex })
        setInput(completed)
        return
      }

      const tokens = tokenize(input)
      const trailing = hasTrailingSpace(input)
      const candidates = getCompletionCandidates(tokens, trailing, commands)

      if (candidates.length === 1) {
        setInput(applyCompletion(input, candidates[0]))
        setSuggestions(null)
        return
      }
      if (candidates.length > 1) {
        setSuggestions({ list: candidates, index: 0, baseInput: input })
        setInput(applyCompletion(input, candidates[0]))
        return
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      setSuggestions(null)
      setHistoryIndex(-1)

      const line = input.trim()

      if (!line) {
        setInput('')
        return
      }

      setHistory(prev => [...prev, line])

      const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const cmdId = addOutput({
        type: 'command',
        prompt: `${theme.prompt.replace('~$', pathLabel(cwd) + '$')}`,
        content: line,
        meta: { status: activeStatus, branch: 'base', time: timeLabel }
      })

      setInput('')
      executeCommand(cmdId, line)

      return
    }
  }

  async function executeCommand(commandId: string | number, line: string): Promise<Status> {
    const tokens = tokenize(line)

    if (!tokens.length) return 'ok'

    const [cmdName, ...args] = tokens

    trackCommand(cmdName, args)

    if (cmdName === 'pwd') {
      addOutput({ type: 'output', content: pathLabel(cwd) })
      finalizeCommand(commandId, 'ok')
      return 'ok'
    }

    if (cmdName === 'cd') {
      const dest = args[0] || '~'
      const target = normalizePath(cwd, dest)
      const node = getNode(FS, target)

      if (!node || !isDir(node)) {
        addOutput({ type: 'error', content: `cd: no such directory: ${dest}` })
        finalizeCommand(commandId, 'err')
        return 'err'
      }

      setCwd(target)
      finalizeCommand(commandId, 'ok')

      return 'ok'
    }
    if (cmdName === 'ls') {
      const target = args[0]
      const entries = vfsList(FS, cwd, target)

      if (!entries) {
        addOutput({ type: 'error', content: `ls: cannot access '${target || '.'}': No such file or directory` })
        finalizeCommand(commandId, 'err')
        return 'err'
      }

      addOutput({ type: 'output', content: (<div className="flex flex-wrap gap-4">{entries.map(e => <span key={e.name} className={e.type === 'dir' ? 'text-[#00ffa6]' : ''}>{e.type === 'dir' ? e.name + '/' : e.name}</span>)}</div>) })
      finalizeCommand(commandId, 'ok')

      return 'ok'
    }
    if (cmdName === 'cat') {
      const target = args[0]

      if (!target) {
        addOutput({ type: 'error', content: 'usage: cat <file>' })
        finalizeCommand(commandId, 'err')
        return 'err'
      }

      const content = vfsRead(FS, cwd, target)

      if (content == null) {
        addOutput({ type: 'error', content: `cat: ${target}: No such file` })
        finalizeCommand(commandId, 'err')
        return 'err'
      }

      addOutput({ type: 'output', content: <pre className="whitespace-pre-wrap">{content}</pre> })
      finalizeCommand(commandId, 'ok')
      return 'ok'
    }

    const cmd = (commands as any)[cmdName]

    if (!cmd) {
      trackUnknownCommand(cmdName)
      addOutput({ type: 'error', content: `Command not found: ${cmdName}. Type \`help\` for available commands.` })
      finalizeCommand(commandId, 'err')
      return 'err'
    }

    try {
      const result = await cmd.handler(args, api)

      if (result !== undefined && result !== null) addOutput({ type: 'output', content: result })
      finalizeCommand(commandId, 'ok')
      return 'ok'
    } catch (error: any) {
      addOutput({ type: 'error', content: `Error: ${error.message}` })
      console.error('Command error:', error)
      finalizeCommand(commandId, 'err')
      return 'err'
      }
    }

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.fg} p-4 sm:p-8 font-mono`}>
        <div className="max-w-5xl mx-auto">
          <div className="border border-gray-600 rounded-lg overflow-hidden shadow-2xl">
            <div className={`${theme.headerBg} px-4 py-2 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                <span className="ml-4 text-sm text-gray-400">siwoo@portfolio ~ v2</span>
              </div>
              <a href="/v1/" className="text-xs text-gray-400 hover:text-[#00ffa6] transition-colors" title="View legacy portfolio">v1 →</a>
            </div>
            <div className={`${theme.terminalBg} p-4 sm:p-6 min-h-[600px] max-h-[80vh] overflow-y-auto`} style={{ scrollbarGutter: 'stable' }}>
              {output.map(item => (
                <div key={item.id} className="mb-3">
                  {item.type === 'command' && <CommandRow theme={theme} item={item} />}
                  {item.type === 'output' && <div className="ml-0">{item.content}</div>}
                  {item.type === 'error' && <div className={`ml-0 ${theme.error}`}>{item.content}</div>}
                  {item.type === 'info' && <div className="ml-0 text-gray-400">{item.content}</div>}
                </div>
              ))}
              <ActivePrompt theme={theme} cwd={cwd} input={input} onChange={(e) => { setInput(e.target.value); if (suggestions) setSuggestions(null) }} onKeyDown={handleKeyDown} activeStatus={activeStatus} inputRef={inputRef} suggestions={suggestions} />
              {suggestions && suggestions.list.length > 1 && (
                <div className="mt-2 ml-6">
                  <div className="text-gray-400 mb-1">Candidates (Tab to cycle):</div>
                  <div className="flex flex-wrap gap-3">
                    {suggestions.list.map((c, idx) => (
                      <span key={c + idx} className={idx === suggestions.index ? 'px-1 rounded bg-[#00ffa6] text-black' : 'text-[#7ee787]'}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div ref={outputEndRef} />
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <span>Built with React + Vite + Tailwind</span>
            <span className="mx-2">·</span>
            <a href="https://github.com/postsw7" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ffa6] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    )
}
