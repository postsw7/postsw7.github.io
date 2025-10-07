// Analytics - Umami Event Tracking
interface TrackPayload { [k: string]: any }

declare global {
  interface Window { umami?: { track: (event: string, data?: TrackPayload) => void } }
  interface ImportMetaEnv { DEV: boolean }
  interface ImportMeta { env: ImportMetaEnv }
}

export function track(eventName: string, eventData: TrackPayload = {}): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Analytics]', eventName, eventData)
    return
  }
  if (typeof window !== 'undefined' && window.umami) {
    try { window.umami.track(eventName, eventData) } catch (err) { /* ignore analytics failure */ }
  }
}

export function trackVisit(): void {
  track('visit', { path: typeof window !== 'undefined' ? window.location.pathname : '', timestamp: Date.now() })
}
export function trackCommand(cmd: string, args: string[] = []): void {
  track('cmd', { cmd, args: args.join(' '), timestamp: Date.now() })
}
export function trackUnknownCommand(cmd: string): void {
  track('cmd_unknown', { cmd, timestamp: Date.now() })
}
export function trackAutocomplete(prefix: string, candidatesCount: number): void {
  track('autocomplete_show', { prefix, count: candidatesCount })
}
export function trackOpen(url: string): void { track('open', { url, timestamp: Date.now() }) }
export function trackRecruiterView(): void { track('recruiter_view', { timestamp: Date.now() }) }
export function trackResumeOpen(): void { track('resume_open', { timestamp: Date.now() }) }

// Demo specific analytics
export function trackDemoStart(name: string): void { track('demo_start', { name, ts: Date.now() }) }
export function trackDemoCommand(name: string, argv: string[], elapsedMs?: number): void {
  track('demo_cmd', { name, argv: argv.join(' '), ms: elapsedMs, ts: Date.now() })
}
export function trackDemoStep(name: string, step: number): void { track('demo_step', { name, step, ts: Date.now() }) }
export function trackDemoError(name: string, error: string): void { track('demo_error', { name, error, ts: Date.now() }) }
