import React from 'react'
import { FILES, fileExists, listFiles } from '../core/files'
import { isValidTheme, getThemeKeys } from '../core/themes'
import { trackRecruiterView, trackResumeOpen, trackOpen } from '../core/analytics'
import { RESUME_URL, LINK_ALIASES, DEMOS } from '../core/constants'
import { HELP_SECTIONS, HELP_FOOTER } from '../core/helpData'
import { RECRUITER } from '../core/recruiterData'
import { Github, Linkedin, Mail, FileText, Link2, HighlighterIcon, MapPin, Hourglass, Workflow, UserRound } from "lucide-react"

const FILE_ICONS: Record<string, React.ReactNode> = {
  'github': <Github size={16} className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'linkedin': <Linkedin size={16} className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'email': <Mail size={16} className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'resume': <FileText size={16} className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'link': <Link2 size={16} className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'highlight': <HighlighterIcon size={18} className="inline-block w-4 h-4 mr-1 text-gray-300" strokeWidth={2.5}/>,
  'location': <MapPin className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'experience': <Hourglass className="inline-block w-4 h-4 mr-1 text-gray-300" />,
  'tagline': <Workflow className="inline-block w-4 h-4 mr-1 text-gray-300" strokeWidth={2.25}/>,
  'profile': <UserRound size={22} className="inline-block mr-1 text-gray-300" />,
}

export interface CommandContextApi {
  echo: (output: React.ReactNode) => void
  files: Record<string, string>
  setTheme?: (theme: string) => void
  clear?: () => void
}

export interface CommandSpec {
  desc: string
  usage?: string
  hidden?: boolean
  handler: (args: string[], api: CommandContextApi) => Promise<React.ReactNode | void> | React.ReactNode | void
}
export type CommandRegistry = Record<string, CommandSpec>

export function createRegistry(api: CommandContextApi, _currentPrompt: string): CommandRegistry {
  try { (globalThis as any).__CLI_FILES__ = Object.keys(FILES) } catch (e) { /* ignore exposure errors */ }
  const registry: CommandRegistry = {
    help: {
      desc: 'Show available commands',
      usage: 'help [command]',
      handler: (args) => {
        if (args.length > 0) {
          const cmdName = args[0]
          const cmd = registry[cmdName]
            if (!cmd) return `Unknown command: ${cmdName}`
          return (
            <div>
              <div className="text-[#00ffa6]">{cmdName}</div>
              <div className="ml-4 mt-1">{cmd.desc}</div>
              {cmd.usage && <div className="ml-4 text-sm text-gray-400">Usage: {cmd.usage}</div>}
            </div>
          )
        }
        return <HelpRenderer />
      }
    },
    clear: {
      desc: 'Clear the terminal',
      handler: () => api.clear && api.clear()
    },
    ls: {
      desc: 'List available files',
      handler: () => {
        const files = listFiles()
        return <div className="grid grid-cols-2 gap-2">{files.map(f => <div key={f} className="text-[#00ffa6]">{f}</div>)}</div>
      }
    },
    cat: {
      desc: 'Display file contents',
      usage: 'cat <filename>',
      handler: (args) => {
        if (!args.length) return 'Usage: cat <filename>. Try: ls'
        const filename = args[0]
        if (!fileExists(filename)) return `File not found: ${filename}. Try: ls`
  return <pre className="whitespace-pre-wrap">{(FILES as Record<string,string>)[filename]}</pre>
      }
    },
    theme: {
      desc: 'Change color theme',
      usage: 'theme <name>',
      handler: (args) => {
        if (!args.length) return `Available themes: ${getThemeKeys().join(', ')}`
        const themeName = args[0].toLowerCase()
        if (!isValidTheme(themeName)) return `Invalid theme: ${themeName}. Available: ${getThemeKeys().join(', ')}`
        api.setTheme && api.setTheme(themeName)
        return `Theme changed to: ${themeName}`
      }
    },
    show: {
      desc: 'Show special content',
      usage: 'show <what>',
      handler: (args) => {
        const what = (args[0] || '').toLowerCase()
        if (what === 'recruiter') { trackRecruiterView(); return <RecruiterCard /> }
        return 'Usage: show recruiter'
      }
    },
    run: {
      desc: 'Run demos and tests',
      usage: 'run <demo|tests> [args...]',
      handler: (args) => {
        const sub = (args[0] || '').toLowerCase()
        if (sub === 'demo') {
          const demoName = (args[1] || '').toLowerCase()
          if (demoName === 'list' || !demoName) {
            // TODO: Link to GitHub repo for full list
            return (
              <div className="space-y-2">
                <div className="text-[#00ffa6]">Available Demos:</div>
                <div className="ml-4 space-y-1">{DEMOS.map(d => <div key={d.key}>• <span className="text-[#00ffa6]">{d.name}</span> - {d.desc}</div>)}</div>
                <div className="text-sm text-gray-400 mt-2">Usage: run demo &lt;name&gt;</div>
              </div>
            )
          }
          if (demoName === 'jgrep') {
            return (
              <div className="space-y-2">
                <div className="text-[#00ffa6]">JSON-Grep Demo</div>
                <div className="text-gray-400">Interactive JSON query tool - Coming soon!</div>
                <div className="text-sm">This will allow you to filter and search JSON data.</div>
              </div>
            )
          }
          return `Unknown demo: ${demoName}. Try: run demo list`
        }
        return 'Usage: run demo <name>'
      }
    },
    resume: {
      desc: 'Open resume in new tab',
      handler: () => { const url = RESUME_URL; trackResumeOpen(); window.open(url, '_blank'); return `Opening resume... (${url})` }
    },
    email: {
      desc: 'Send me an email',
      handler: () => { const email = 'postsw7@gmail.com'; trackOpen(`mailto:${email}`); window.location.href = `mailto:${email}`; return `Opening email client for ${email}...` }
    },
    linkedin: {
      desc: 'Open LinkedIn profile',
      handler: () => { const url = LINK_ALIASES.linkedin; trackOpen(url); window.open(url, '_blank'); return 'Opening LinkedIn...' }
    },
    github: {
      desc: 'Open GitHub profile',
      handler: () => { const url = LINK_ALIASES.github; trackOpen(url); window.open(url, '_blank'); return 'Opening GitHub...' }
    },
    open: {
      desc: 'Open a known link',
      usage: 'open <github|linkedin|resume>',
      handler: (args) => { const alias = (args[0] || '').toLowerCase(); const map = LINK_ALIASES as Record<string,string>; if (!alias || !map[alias]) return 'Usage: open <github|linkedin|resume>'; const url = map[alias]; trackOpen(url); window.open(url, '_blank'); return `Opening ${alias}...` }
    },
    social: {
      desc: 'Show social links',
      handler: () => (
        <div className="space-y-1">
          <div><span className="text-[#00ffa6]">linkedin</span> → https://www.linkedin.com/in/siwoolee/</div>
          <div><span className="text-[#00ffa6]">github</span> → https://github.com/postsw7</div>
          <div><span className="text-[#00ffa6]">email</span> → postsw7@gmail.com</div>
        </div>
      )
    }
  }
  return registry
}

function HelpRenderer() {
  return (
    <div className="space-y-3">
      <div className="text-[#00ffa6] font-bold">Available Commands:</div>
      {HELP_SECTIONS.map(section => (
        <div key={section.title}>
          <div className="text-[#fff292]">{section.title}:</div>
          <div className="ml-4 text-sm space-y-1">
            {section.items.map(it => <div key={it.cmd}><span className="text-[#00ffa6]">{it.cmd}</span> - {it.desc}</div>)}
          </div>
        </div>
      ))}
      <div className="text-sm text-gray-400 mt-3">{HELP_FOOTER}</div>
    </div>
  )
}

function RecruiterCard() {
  return (
    <div className="border border-[#00ffa6]/30 rounded-lg p-6 max-w-2xl space-y-4 bg-[#1a1f2a]">
      <div className="text-xl font-bold text-[#00ffa6]">
        <div className="center-flex justify-self-start">{FILE_ICONS['profile']} <span>{RECRUITER.name}</span></div>
      </div>
      <div className="space-y-2 text-sm">
        <div>{FILE_ICONS['location']} <span className="text-gray-300">{RECRUITER.location}</span></div>
        <div>{FILE_ICONS['experience']} <span className="text-gray-300">{RECRUITER.experience}</span></div>
        <div>{FILE_ICONS['tagline']} <span className="text-gray-300">{RECRUITER.tagline}</span></div>
      </div>
      <div className="pt-3 border-t border-gray-700">
        <div className="text-[#fff292] mb-2">{FILE_ICONS['highlight']} Key Highlights:</div>
        <ul className="text-sm space-y-1 ml-4 text-gray-400">{RECRUITER.highlights.map(h => <li key={h}>• {h}</li>)}</ul>
      </div>
      <div className="pt-3 border-t border-gray-700 space-y-2">
        <div className="text-[#fff292]">{FILE_ICONS['link']} Quick Links:</div>
        <div className="flex flex-wrap gap-3 text-sm">
          {RECRUITER.links.map((l, i) => (
            <React.Fragment key={l.type}>
              {i !== 0 && <span className="text-gray-600">|</span>}
              <a
                href={l.url}
                target={l.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={() => { if (l.type === 'resume') trackResumeOpen() }}
                className="text-[#4285f4] hover:underline cursor-pointer center-flex"
              >
                {FILE_ICONS[l.type]}
                {l.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="pt-3 text-xs text-gray-500">
        See more details in <span className="text-[#44D39F]">Resume</span> or <span className="text-[#44D39F]">LinkedIn</span>.
      </div>
    </div>
  )
}
