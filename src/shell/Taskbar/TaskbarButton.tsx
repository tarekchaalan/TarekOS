import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Win7Icon } from '@/shared/components/Win7Icon'
import { useStore } from '@/system/store'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import type { WindowInstance } from '@/shared/types/window.types'

interface TaskbarButtonProps {
  appId: string
  icon?: string
  label: string
  windows: WindowInstance[]
  isPinned: boolean
  onClickApp: (appId: string) => void
}

/* ------------------------------------------------------------------ */
/*  Preview popup                                                      */
/* ------------------------------------------------------------------ */

const PREVIEW_WIDTH = 200
const HOVER_DELAY = 400
const LEAVE_GRACE = 200

function TaskbarPreview({
  windows,
  buttonRect,
}: {
  windows: WindowInstance[]
  buttonRect: DOMRect
}) {
  const focusWindow = useStore((s) => s.focusWindow)
  const closeWindow = useStore((s) => s.closeWindow)

  // Calculate horizontal center, clamped to viewport
  const centerX = buttonRect.left + buttonRect.width / 2
  let left = centerX - PREVIEW_WIDTH / 2
  const margin = 8
  if (left < margin) left = margin
  if (left + PREVIEW_WIDTH > window.innerWidth - margin)
    left = window.innerWidth - margin - PREVIEW_WIDTH

  const bottom = TASKBAR_HEIGHT + 4

  return (
    <div
      className="fixed"
      style={{
        left,
        bottom,
        width: PREVIEW_WIDTH,
        zIndex: 10000,
      }}
    >
      <div
        className="overflow-hidden rounded-md border backdrop-blur-md"
        style={{
          background: 'rgba(20,20,30,0.85)',
          borderColor: 'rgba(255,255,255,0.15)',
          boxShadow:
            '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {windows.map((win) => (
          <PreviewItem
            key={win.id}
            win={win}
            onFocus={() => focusWindow(win.id)}
            onClose={(e) => {
              e.stopPropagation()
              closeWindow(win.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewItem({
  win,
  onFocus,
  onClose,
}: {
  win: WindowInstance
  onFocus: () => void
  onClose: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
      style={{
        background: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onFocus}
    >
      <Win7Icon name={win.icon ?? 'icon.app'} size={16} />
      <span
        className="flex-1 truncate text-xs text-white/90"
        style={{ maxWidth: 180 - 16 - 24 - 20 }}
      >
        {win.title}
      </span>
      {hovered && (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] leading-none text-white/60 transition-colors hover:bg-red-500/80 hover:text-white"
          onClick={onClose}
          role="button"
          aria-label={`Close ${win.title}`}
        >
          ✕
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main button                                                        */
/* ------------------------------------------------------------------ */

export function TaskbarButton({
  appId,
  icon,
  label,
  windows,
  isPinned,
  onClickApp,
}: TaskbarButtonProps) {
  const hasWindows = windows.length > 0
  const hasFocused = windows.some((w) => w.focused)

  const handleClick = useCallback(() => {
    onClickApp(appId)
  }, [appId, onClickApp])

  /* ---------- hover preview state ---------- */
  const [showPreview, setShowPreview] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (!hasWindows) return
    // Cancel any pending leave
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
    hoverTimerRef.current = setTimeout(() => {
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect())
      }
      setShowPreview(true)
    }, HOVER_DELAY)
  }, [hasWindows])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    leaveTimerRef.current = setTimeout(() => {
      setShowPreview(false)
    }, LEAVE_GRACE)
  }, [])

  // If the mouse enters the preview popup, cancel the leave timer
  const handlePreviewEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const handlePreviewLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setShowPreview(false)
    }, LEAVE_GRACE)
  }, [])

  // Clean up timers on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // Close preview if all windows close
  useEffect(() => {
    if (!hasWindows) setShowPreview(false)
  }, [hasWindows])

  return (
    <>
      <button
        ref={buttonRef}
        className={`relative flex h-full w-[42px] items-center justify-center rounded-sm transition-all ${
          hasFocused
            ? 'bg-[rgba(255,255,255,0.22)] shadow-[inset_0_-2px_0_rgba(80,160,255,0.8)]'
            : hasWindows
              ? 'bg-[rgba(255,255,255,0.08)] shadow-[inset_0_-2px_0_rgba(80,160,255,0.4)] hover:bg-[rgba(255,255,255,0.15)]'
              : 'hover:bg-[rgba(255,255,255,0.1)]'
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={showPreview ? undefined : label}
        aria-label={label}
      >
        <Win7Icon name={icon ?? 'icon.app'} size={24} />
      </button>

      {showPreview &&
        buttonRect &&
        createPortal(
          <div
            onMouseEnter={handlePreviewEnter}
            onMouseLeave={handlePreviewLeave}
          >
            <TaskbarPreview windows={windows} buttonRect={buttonRect} />
          </div>,
          document.body,
        )}
    </>
  )
}
