import React from 'react'

import { StatusPill } from './StatusPill'

interface CommandMeta {
  status: 'ok' | 'int' | 'err'
  time: string
}
interface Item {
  id: string | number
  prompt?: string
  content?: any
  meta?: CommandMeta
}
interface Props {
  item: Item
}

export function CommandRow({ item }: Props) {
  return (
    <div
      role="group"
      aria-label="command"
      className="flex items-center justify-between gap-2 text-[14px] leading-none -mx-4 sm:-mx-6"
    >
      <div className="flex items-center min-w-0">
        <div className="flex items-center bg-prompt rounded-l pl-2 pr-1 h-6 leading-none">
          <span className="text-[#00b2ff]">{item.prompt}</span>
        </div>
        <div
          className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[12px]"
          style={{ borderLeftColor: 'var(--prompt-tri)' }}
        ></div>
        <span className="ml-2 truncate !overflow-visible">{item.content}</span>
      </div>
      {item.meta && (
        <div className="flex items-center gap-0 shrink-0">
          <div
            className="w-0 h-0 border-y-[12px] border-y-transparent border-r-[12px]"
            style={{ borderRightColor: 'var(--prompt-tri)' }}
          ></div>
          <StatusPill status={item.meta.status} time={item.meta.time} />
        </div>
      )}
    </div>
  )
}
