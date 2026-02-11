import { useState, useEffect, useCallback } from 'react'
import { isMuted, setMuted } from '@/system/sounds/sounds'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

/* Small SVG tray icons */
function WifiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 11.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" />
      <path d="M4.1 8.2a4.1 4.1 0 0 1 5.8 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 6a7 7 0 0 1 10 0" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function VolumeIcon({ muted: isMute }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 5.5h2l3-2.5v8l-3-2.5H2a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5Z" />
      {!isMute && (
        <>
          <path d="M9 5a3 3 0 0 1 0 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M10.5 3.5a5.5 5.5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {isMute && (
        <line x1="9" y1="5" x2="12" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function SystemTray() {
  const [now, setNow] = useState(() => new Date())
  const [muted, setMutedState] = useState(isMuted)

  useEffect(() => {
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const timeout = setTimeout(() => {
      setNow(new Date())
    }, msUntilNextMinute)

    return () => clearTimeout(timeout)
  }, [now])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }, [muted])

  return (
    <div className="flex items-center gap-1.5 px-2">
      {/* Decorative tray icons */}
      <button
        className="flex items-center justify-center rounded p-1 text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)]"
        title="Network"
      >
        <WifiIcon />
      </button>
      <button
        className="flex items-center justify-center rounded p-1 text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)]"
        title={muted ? 'Unmute' : 'Mute'}
        onClick={toggleMute}
      >
        <VolumeIcon muted={muted} />
      </button>

      {/* Clock */}
      <button className="flex flex-col items-end rounded px-2 py-0.5 hover:bg-[rgba(255,255,255,0.1)]">
        <span className="text-[11px] leading-tight text-white">{formatTime(now)}</span>
        <span className="text-[10px] leading-tight text-[rgba(255,255,255,0.7)]">{formatDate(now)}</span>
      </button>
    </div>
  )
}
