// Centralized string constants for prompt/user identifiers and common labels.
// Update here to propagate across the UI.

export const STRINGS = {
  user: 'siwoo',
  host: 'lee',
  promptBase: 'siwoo@lee', // user@host
  versionLabel: 'v2',
  legacyLabel: 'v1',
  legacyLinkTitle: 'View legacy portfolio',
}

export function buildPrompt(pathLabel: string): string {
  return `${STRINGS.promptBase}:${pathLabel}$`
}

export function rootPrompt(): string {
  return `${STRINGS.promptBase}:~$`
}
