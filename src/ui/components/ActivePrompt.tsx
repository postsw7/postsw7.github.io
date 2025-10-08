import React, { ChangeEvent, KeyboardEvent } from 'react'
import { ActiveStatusPill } from './ActiveStatusPill'
import { pathLabel } from '../../core/vfs'

interface Props {
  cwd: string[]
  input: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  activeStatus: 'ok' | 'int' | 'err'
  inputRef: React.RefObject<HTMLInputElement>
  suggestions: any
}

export function ActivePrompt({ cwd, input, onChange, onKeyDown, activeStatus, inputRef }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 text-[14px] leading-none -mx-8 sm:-mx-6">
      <div className="flex items-center bg-prompt rounded-l pl-2 pr-1 h-6 leading-none">
        <span className="text-[#00b2ff]">siwoo@lee:{pathLabel(cwd)}$</span>
      </div>
      <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[12px] -ml-2" style={{ borderLeftColor: 'var(--prompt-tri)' }}></div>
      <div className="flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent outline-none text-fg"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
      <div className="flex items-center gap-0 shrink-0 leading-none">
        <div className="w-0 h-0 border-y-[12px] border-y-transparent border-r-[12px]" style={{ borderRightColor: 'var(--prompt-tri)' }}></div>
        <ActiveStatusPill status={activeStatus} />
      </div>
    </div>
  )
}
