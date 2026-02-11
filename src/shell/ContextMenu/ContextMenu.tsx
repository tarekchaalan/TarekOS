import { useEffect, useRef, useCallback } from 'react'

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  action: () => void
  disabled?: boolean
  separator?: false
}

export interface MenuSeparator {
  separator: true
}

export type MenuEntry = MenuItem | MenuSeparator

interface ContextMenuProps {
  x: number
  y: number
  items: MenuEntry[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position to keep menu within viewport
  const adjustedPos = useRef({ x, y })
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let ax = x
    let ay = y
    if (x + rect.width > window.innerWidth) ax = window.innerWidth - rect.width - 4
    if (y + rect.height > window.innerHeight) ay = window.innerHeight - rect.height - 4
    if (ax < 0) ax = 4
    if (ay < 0) ay = 4
    adjustedPos.current = { x: ax, y: ay }
    el.style.left = `${ax}px`
    el.style.top = `${ay}px`
  }, [x, y])

  // Close on click outside or Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleDown, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.disabled) return
      item.action()
      onClose()
    },
    [onClose],
  )

  return (
    <div
      ref={menuRef}
      className="fixed z-[99999] min-w-[180px] rounded border border-[#9ba7b7] bg-[#f2f2f2] py-[3px] shadow-[2px_2px_8px_rgba(0,0,0,0.25)]"
      style={{ left: x, top: y }}
    >
      {items.map((entry, i) => {
        if (entry.separator) {
          return <div key={i} className="mx-[6px] my-[3px] border-t border-[#d5d5d5]" />
        }
        return (
          <button
            key={i}
            className={`flex w-full items-center gap-3 px-6 py-[4px] text-left text-[12px] transition-colors ${
              entry.disabled
                ? 'cursor-default text-[#a0a0a0]'
                : 'text-[#1a1a1a] hover:bg-[#91c9f7] hover:text-white'
            }`}
            onClick={() => handleItemClick(entry)}
            disabled={entry.disabled}
          >
            <span className="w-4 text-center">{entry.icon}</span>
            <span>{entry.label}</span>
          </button>
        )
      })}
    </div>
  )
}
