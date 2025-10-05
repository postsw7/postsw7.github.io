import React, { useState, useEffect } from 'react'

interface Props { status: 'ok' | 'int' | 'err' }

export function ActiveStatusPill({ status }: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-2 text-sm bg-[#2b2f3a] rounded-r px-0 pr-2 h-6 leading-none">
      {status === 'ok' && <span className="text-[#27c93f]">✓</span>}
      {status === 'int' && <span className="text-[#e75448]">INT ×</span>}
      {status === 'err' && <span className="text-[#e75448]">ERR ×</span>}
      <span className="opacity-60 text-[#656565]">⟨</span>
      <span className="opacity-80 text-[#00b3b0]">base</span>
      <span className="opacity-60 text-[#656565]">•</span>
      <span className="opacity-80 text-[#538888]">{timeLabel}</span>
    </div>
  )
}
