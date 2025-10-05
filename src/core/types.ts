import React from 'react'

export type CLIOutput = string | React.ReactNode | (string | React.ReactNode)[]

export interface API {
  echo: (output: CLIOutput) => void
  files: Record<string, string>
  setTheme?: (theme: string) => void
  clear?: () => void
}

export type CommandHandler = (
  args: string[],
  api: API
) => Promise<CLIOutput | void> | CLIOutput | void

export interface CommandSpec {
  desc: string
  usage?: string
  handler: CommandHandler
  hidden?: boolean
}

export type CommandRegistry = Record<string, CommandSpec>

export interface HistoryEntry {
  command: string
  timestamp: number
}

export interface OutputLine {
  id: string
  prompt?: string
  command?: string
  output?: CLIOutput
  type: 'command' | 'output' | 'error'
}
