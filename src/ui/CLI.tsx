// ============================================================================
// CLI Component - Interactive Terminal
// ============================================================================
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { tokenize, hasTrailingSpace } from '../core/tokenize'
import { trackVisit, trackCommand, trackUnknownCommand } from '../core/analytics'
import { createRegistry } from '../commands/registry'
import { runJgrep, isJgrepReady } from '../external/jgrepWorkerClient'
import { trackDemoError } from '../core/analytics'
import { FS, list as vfsList, read as vfsRead, normalizePath, getNode, isDir, pathLabel } from '../core/vfs'
import { getCompletionCandidates, applyCompletion } from './autocomplete'
import { CommandRow } from './components/CommandRow'
import { ActivePrompt } from './components/ActivePrompt'
import { Banner } from './components/Banner'
import { STRINGS, buildPrompt, rootPrompt } from '../core/strings'

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
  // Theme now driven purely by CSS data-theme; no local state needed
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cwd, setCwd] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [output, setOutput] = useState<LineItem[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionState | null>(null)
  const [activeStatus, setActiveStatus] = useState<Status>('ok')
  // Inline jgrep spinner state (replaces itself with result once loaded)
  const [jgrepSpinner, setJgrepSpinner] = useState<{ id: string; start: number } | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const outputEndRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Track visit + welcome
  useEffect(() => {
    trackVisit()

    try { (globalThis as any).__CLI_CWD__ = cwd } catch (e) { /* no-op */ }

    addOutput({ type: 'output', content: (
      <div className="space-y-2">
        <Banner />
      </div>
    ) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Robust scroll-to-bottom: explicitly set scrollTop to scrollHeight after output changes.
  useEffect(() => {
    const container = scrollRef.current
    const endEl = outputEndRef.current as any
    if (!container) return

    const forceScroll = () => {
      try { container.scrollTop = container.scrollHeight } catch {/* ignore */}
    }

    // Try native anchor scrolling first (not smooth to avoid partial positioning), then force.
    if (endEl && typeof endEl.scrollIntoView === 'function') {
      try { endEl.scrollIntoView({ block: 'end' }) } catch {/* ignore */}
    }
    forceScroll()
    // Ensure after paint / layout
    requestAnimationFrame(forceScroll)
  }, [output, suggestions])
  useEffect(() => { try { (globalThis as any).__CLI_CWD__ = cwd } catch (e) { /* ignore */ } }, [cwd])
  useEffect(() => { const h = () => inputRef.current?.focus(); document.addEventListener('click', h); return () => document.removeEventListener('click', h) }, [])

  const api = {
    echo: (content: React.ReactNode) => addOutput({ type: 'output', content }),
    clear: () => setOutput([]),
    setTheme: (key: string) => {
      const k = key === 'light' ? 'light' : 'dark'
      document.documentElement.dataset.theme = k as any
    },
    files: {},
  }
  const commands = createRegistry(api, rootPrompt())

  // Animate spinner if active (first-time runtime load only)
  useEffect(() => {
    if (!jgrepSpinner) return
    const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
    let idx = 0
    const id = setInterval(() => {
      idx = (idx + 1) % frames.length
      const frameChar = frames[idx]
      setOutput(prev => prev.map(line => line.id === jgrepSpinner.id ? { ...line, type: 'info', content: <span className="text-gray-400">{frameChar} loading jgrep runtime...</span> } : line))
    }, 90)
    return () => clearInterval(id)
  }, [jgrepSpinner])

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
  prompt: buildPrompt(pathLabel(cwd)),
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
  prompt: buildPrompt(pathLabel(cwd)),
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

  addOutput({ type: 'output', content: (<div className="flex flex-wrap gap-4">{entries.map(e => <span key={e.name} className={e.type === 'dir' ? 'text-accent' : ''}>{e.type === 'dir' ? e.name + '/' : e.name}</span>)}</div>) })
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

    // External jgrep command passthrough
    if (cmdName === 'jgrep') {
      const ready = isJgrepReady()
      const buildNodeFromResult = (result: any) => {
        if (result.format === 'lines') {
          const text = result.lines.length ? result.lines.join('\n') : '(no matches)'
          return <pre className="whitespace-pre-wrap">{text}</pre>
        } else if (result.format === 'pretty') {
          return <pre className="whitespace-pre">{result.blocks.join('\n')}</pre>
        } else if (result.format === 'table') {
          const widths = result.header.map((h: string, i: number) => Math.max(h.length, ...result.rows.map((r: string[]) => (r[i] || '').length)))
          const pad = (v: string, i: number) => v + ' '.repeat(widths[i] - v.length)
          const linesTxt = [result.header.map(pad).join('  '), ...result.rows.map((r: string[]) => r.map(pad).join('  '))]
          return <pre className="whitespace-pre">{linesTxt.join('\n')}</pre>
        } else if (result.format === 'tokens') {
          return (
            <div className="space-y-1">
              {result.lines.map((ln: any, idx: number) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {ln.map((tok: any, i: number) => {
                    const base = 'font-mono'
                    let cls = ''
                    switch (tok.t) {
                      case 'match': cls = 'text-[#ffa198] font-semibold'; break
                      case 'key': cls = 'text-gray-400'; break
                      case 'value': cls = 'text-gray-400'; break
                      case 'number': cls = 'text-amber-300'; break
                      case 'string': cls = 'text-gray-400'; break
                      default: cls = 'text-gray-400'; break
                    }
                    return <span key={i} className={`${base} ${cls}`}>{tok.v}</span>
                  })}
                </div>
              ))}
            </div>
          )
        }
        return <pre className="whitespace-pre-wrap">(unknown format)</pre>
      }

      if (ready) {
        try {
          const result = await runJgrep([cmdName, ...args])
          addOutput({ type: 'output', content: buildNodeFromResult(result) })
          finalizeCommand(commandId, 'ok')
          return 'ok'
        } catch (err: any) {
          trackDemoError('jgrep', err?.message || 'unknown')
          addOutput({ type: 'error', content: (err?.message || 'jgrep: error: unknown failure') })
          finalizeCommand(commandId, 'err')
          return 'err'
        }
      }

      // Not ready yet: show first-load spinner with enforced delay
      const spinnerStart = Date.now()
      const spinnerId = addOutput({ type: 'info', content: <span className="text-gray-400">⠋ loading jgrep runtime...</span> })
      setJgrepSpinner({ id: spinnerId, start: spinnerStart })
      const MIN_SPINNER_MS = 2000
      const deferUntilMin = (fn: () => void) => {
        const elapsed = Date.now() - spinnerStart
        const remaining = MIN_SPINNER_MS - elapsed
        if (remaining > 0) {
          setTimeout(fn, remaining)
        } else {
          fn()
        }
      }
      try {
        const result = await runJgrep([cmdName, ...args])
        const replace = () => {
          setOutput(prev => prev.map(line => line.id === spinnerId ? { ...line, type: 'output', content: buildNodeFromResult(result) } : line))
          setJgrepSpinner(null)
          finalizeCommand(commandId, 'ok')
        }
        deferUntilMin(replace)
        return 'ok'
      } catch (err: any) {
        trackDemoError('jgrep', err?.message || 'unknown')
        const replaceErr = () => {
          setOutput(prev => prev.map(line => line.id === spinnerId ? { ...line, type: 'error', content: (err?.message || 'jgrep: error: unknown failure') } : line))
          setJgrepSpinner(null)
          finalizeCommand(commandId, 'err')
        }
        deferUntilMin(replaceErr)
        return 'err'
      }
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
  <div className="min-h-screen bg-app text-fg p-4 sm:p-8 font-mono">
        <div className="max-w-5xl mx-auto">
          <div className="border border-gray-600 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-header px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                <span className="ml-4 text-sm text-gray-400">{STRINGS.promptBase} ~ {STRINGS.versionLabel}</span>
              </div>
              <a href="/v1/" className="text-xs text-gray-400 hover:text-accent transition-colors" title="View legacy portfolio">v1 →</a>
            </div>
            <div ref={scrollRef} className="bg-terminal p-4 sm:p-6 min-h-[600px] max-h-[80vh] overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
              {output.map(item => (
                <div key={item.id} className="mb-3">
                  {item.type === 'command' && <CommandRow item={item} />}
                  {item.type === 'output' && <div className="ml-0">{item.content}</div>}
                  {item.type === 'error' && <div className="ml-0 text-[#e75448]">{item.content}</div>}
                  {item.type === 'info' && <div className="ml-0 text-gray-400">{item.content}</div>}
                </div>
              ))}
              <ActivePrompt cwd={cwd} input={input} onChange={(e) => { setInput(e.target.value); if (suggestions) setSuggestions(null) }} onKeyDown={handleKeyDown} activeStatus={activeStatus} inputRef={inputRef} suggestions={suggestions} />
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
          <footer className="mt-4 text-center text-sm text-gray-500">
            <a href="https://github.com/postsw7/postsw7.github.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a>
          </footer>
        </div>
      </div>
    )
}
