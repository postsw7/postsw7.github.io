// Global ambient declarations
// Extend window.umami for analytics safely
interface Umami {
  track: (event: string, data?: Record<string, any>) => void
}

interface Window {
  umami?: Umami
  __CLI_CWD__?: string[]
}

export {}
