// JGrep Web Worker Client (stub integration)
// Handles loading the worker (Pyodide-backed in real deployment) and sending commands.
// The real worker will be delivered into /public/jgrep/ by the json-grep repo action.

import { JGREP_WORKER_PATH, JGREP_VERSION_META_PATH } from '../core/constants'
import { trackDemoCommand, trackDemoError } from '../core/analytics'

export interface JgrepToken { t: string; v: string }
export type JgrepResult =
  | { format: 'lines'; lines: string[]; meta?: any }
  | { format: 'table'; header: string[]; rows: string[][]; meta?: any }
  | { format: 'pretty'; blocks: string[]; meta?: any }
  | { format: 'json'; data: any[]; meta?: any }
  | { format: 'tokens'; lines: JgrepToken[][]; meta?: any }

interface Pending { resolve: (v: JgrepResult) => void; reject: (e: any) => void; started: number; argv: string[] }

let worker: Worker | null = null
let ready = false
let versionTag: string | null = null
const pending = new Map<string, Pending>()

function genId(): string { return Math.random().toString(36).slice(2) }

async function fetchVersion(): Promise<string | null> {
  try {
    const res = await fetch(JGREP_VERSION_META_PATH + '?t=' + Date.now())
    if (!res.ok) return null
    const data = await res.json()
    return data.commit || null
  } catch { return null }
}

export async function ensureWorker(): Promise<void> {
  if (ready) return
  if (!worker) {
    versionTag = await fetchVersion()
    const url = versionTag ? `${JGREP_WORKER_PATH}?v=${versionTag}` : JGREP_WORKER_PATH
    worker = new Worker(url)
    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data
      if (msg?.type === 'ready') {
        ready = true
        return
      }
      if (msg?.type === 'result') {
        const p = pending.get(msg.id)
        if (p) {
          pending.delete(msg.id)
          trackDemoCommand('jgrep', p.argv, Date.now() - p.started)
          p.resolve(msg as any)
        }
        return
      }
      if (msg?.type === 'error') {
        const p = pending.get(msg.id)
        if (p) {
          pending.delete(msg.id)
          trackDemoError('jgrep', msg.error || 'unknown')
          p.reject(new Error(msg.error || 'Unknown error'))
        }
        return
      }
    }
    worker.onerror = (e) => {
      console.error('Worker error', e)
    }
  }
  // Wait until ready message or timeout after 8s
  await new Promise<void>((resolve, reject) => {
    const start = Date.now()
    const max = 20000 // 20s for initial Pyodide load on slower networks
    const interval = setInterval(() => {
      if (ready) { clearInterval(interval); resolve() }
      if (Date.now() - start > max) { clearInterval(interval); reject(new Error('jgrep runtime load timeout (exceeded 20s)')) }
      // Expose transient readiness for debugging
      try { (globalThis as any).__JGREP_READY__ = ready } catch { /* noop */ }
    }, 150)
  })
}

export function isJgrepReady(): boolean { return ready }

export async function runJgrep(argv: string[]): Promise<JgrepResult> {
  await ensureWorker()
  if (!worker) throw new Error('worker missing')
  const id = genId()
  const started = Date.now()
  const p = new Promise<JgrepResult>((resolve, reject) => {
    pending.set(id, { resolve, reject, started, argv })
  })
  worker.postMessage({ type: 'run', id, argv })
  // Fallback timeout 5s
  setTimeout(() => {
    if (pending.has(id)) {
      const pend = pending.get(id)!
      pending.delete(id)
      trackDemoError('jgrep', 'timeout')
      pend.reject(new Error('jgrep: error: execution timed out (5s)'))
    }
  }, 5000)
  return p
}

// Development stub: if no real worker exists, fabricate a result
if (import.meta.env.DEV) {
  // Attempt to detect 404 by prefetching
  fetch(JGREP_WORKER_PATH, { method: 'HEAD' }).then(res => {
    if (!res.ok) {
      // Replace ensureWorker & runJgrep with mock
      console.warn('[jgrep demo] worker not found, using mock responses')
  ready = true
  worker = { postMessage: () => {} } as unknown as Worker
  // Dynamically override exported functions in dev mock scenario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ensureWorker as any) = async () => { ready = true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(runJgrep as any) = async (argv: string[]) => {
        const line = argv.join(' ')
        if (argv.includes('--table')) {
          return { format: 'table', header: ['ts', 'service', 'err.code'], rows: [ ['2025-10-06T00:00:00Z','auth','AUTH-42'] ] }
        }
        return { format: 'lines', lines: [`mock result for: ${line}`] }
      }
    }
  }).catch(() => {/* ignore */})
}
