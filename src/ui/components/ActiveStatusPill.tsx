import React, { useState, useEffect } from 'react'

interface Props { status: 'ok' | 'int' | 'err' }

export function ActiveStatusPill({ status }: Props) {
  const [now, setNow] = useState(() => new Date())

  // Update exactly at the start of each new minute so the active pill never
  // lags behind a recently executed command that captured a later minute.
  useEffect(() => {
    let timeout: number
    function schedule() {
      const d = new Date()
      setNow(d)
      // milliseconds until the next minute boundary
      const ms = (60 - d.getSeconds()) * 1000 - d.getMilliseconds()
      timeout = window.setTimeout(schedule, ms)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])

  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-2 text-sm bg-prompt rounded-r px-0 pr-2 h-6 leading-none">
      {status === 'ok' && <span className="text-[#27c93f]">✓</span>}
      {status === 'int' && <span className="text-[#e75448]">INT ×</span>}
      {status === 'err' && <span className="text-[#e75448]">ERR ×</span>}
      <span className="opacity-60 text-gray-500">⟨</span>
      <span className="opacity-80 text-[#00b3b0]">base</span>
      <span className="opacity-60 text-gray-500">•</span>
      <span className="opacity-80 text-[#538888]">{timeLabel}</span>
    </div>
  )
}
