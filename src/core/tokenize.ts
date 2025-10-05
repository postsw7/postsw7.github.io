// Command Line Tokenizer
export function tokenize(line: unknown): string[] {
  if (typeof line !== 'string' || !line) return []
  const tokens: string[] = []
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    const token = match[1] || match[2] || match[3]
    if (token) tokens.push(token)
  }
  return tokens
}

export function hasTrailingSpace(line: string | null | undefined): boolean {
  if (!line) return false
  return line.endsWith(' ')
}
