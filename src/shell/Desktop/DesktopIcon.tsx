import { useState, useCallback, useRef } from 'react'
import { Win7Icon } from '@/shared/components/Win7Icon'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'

interface DesktopIconProps {
  node: VfsTreeNode
  position: { x: number; y: number }
  onMove: (nodeId: string, x: number, y: number) => void
  onDoubleClick: (node: VfsTreeNode) => void
  onContextMenu: (e: React.MouseEvent, node: VfsTreeNode) => void
}

/** Snap to 10px grid */
const snap = (v: number) => Math.round(v / 10) * 10

export function DesktopIcon({ node, position, onMove, onDoubleClick, onContextMenu }: DesktopIconProps) {
  const [selected, setSelected] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
    dragging: boolean
  } | null>(null)

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(node)
  }, [node, onDoubleClick])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(true)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      setSelected(true)

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
        dragging: false,
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragRef.current) return
        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY

        if (!dragRef.current.dragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          dragRef.current.dragging = true
        }
        if (!dragRef.current.dragging) return

        const rawX = dragRef.current.origX + dx
        const rawY = dragRef.current.origY + dy

        // Keep within desktop bounds (icon is ~76px wide, ~90px tall)
        const boundedX = Math.max(0, Math.min(window.innerWidth - 76, rawX))
        const boundedY = Math.max(0, Math.min(window.innerHeight - 130, rawY))

        onMove(node.id, snap(boundedX), snap(boundedY))
      }

      const onPointerUp = () => {
        dragRef.current = null
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [node.id, position, onMove],
  )

  return (
    <div
      className={`absolute flex w-[76px] cursor-default flex-col items-center gap-1 rounded p-2 transition-colors ${
        selected ? 'bg-[rgba(80,140,220,0.35)] outline outline-1 outline-[rgba(80,140,220,0.6)]' : 'hover:bg-[rgba(255,255,255,0.08)]'
      }`}
      style={{ left: position.x, top: position.y }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(true); onContextMenu(e, node) }}
      onBlur={() => setSelected(false)}
      tabIndex={0}
    >
      <Win7Icon name={node.icon ?? 'icon.file'} size={48} />
      <span className="max-w-[72px] text-center text-[11px] leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        {node.name}
      </span>
    </div>
  )
}
