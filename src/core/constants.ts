export interface LinkAliases {
  github: string
  linkedin: string
  resume: string
  [k: string]: string
}

export interface DemoSpec { key: string; name: string; desc: string }

export const RESUME_URL: string = 'https://drive.google.com/file/d/1EFuRm4YJsGxEkVarX2jsISmjD3otkJA3/view'

export const LINK_ALIASES: LinkAliases = {
  github: 'https://github.com/postsw7',
  linkedin: 'https://www.linkedin.com/in/siwoolee/',
  resume: RESUME_URL,
}

export const SOCIAL_LINKS: { key: string; label: string; url: string }[] = [
  { key: 'linkedin', label: 'linkedin', url: LINK_ALIASES.linkedin },
  { key: 'github', label: 'github', url: LINK_ALIASES.github },
  { key: 'email', label: 'email', url: 'mailto:postsw7@gmail.com' },
]

export const DEMOS: DemoSpec[] = [
  { key: 'jgrep', name: 'jgrep', desc: 'JSON-Grep interactive JSON log search demo' },
]

// JGREP demo steps (used by tutorial controller)
export interface JgrepDemoStep { idx: number; command: string; title: string; blurb: string }
export const JGREP_DEMO_STEPS: JgrepDemoStep[] = [
  { idx: 0, command: 'jgrep -E "user" sample.jsonl', title: 'Regex search', blurb: 'Find lines containing the word user.' },
  { idx: 1, command: 'jgrep --key user.id -E "\\d\\d\\d" sample.jsonl', title: 'Key-based match', blurb: 'Match user.id values of exactly 3 digits.' },
  { idx: 2, command: 'jgrep -E "NO_SUCH_EVENT" sample.jsonl', title: 'No matches', blurb: 'Demonstrates a pattern with zero matches -> outputs (no matches).' },
  { idx: 3, command: 'jgrep --where "level=ERROR service=auth" sample.jsonl', title: 'Where filters', blurb: 'Filter logs where level=ERROR and service=auth.' },
  { idx: 4, command: 'jgrep --extract ts,service,err.code --table sample.jsonl', title: 'Extraction', blurb: 'Extract selected fields into a table.' },
  { idx: 5, command: 'jgrep --extract ts,service,err.code --table --where "err.code=PMT-13" sample.jsonl', title: 'Combination', blurb: 'Combine multiple filters and extractions.' },
  { idx: 6, command: 'jgrep --where "level=ERROR" --pretty sample.jsonl', title: 'Pretty print', blurb: 'Pretty-print matching JSON lines.' },
]

export const JGREP_WORKER_PATH = '/jgrep/worker.js' // final location (assets copied via GH Action)
export const JGREP_VERSION_META_PATH = '/jgrep/version.json'

export function listDemoKeys(): string[] {
  return DEMOS.map(d => d.key)
}
