import { useCallback, useRef } from 'react'
import type { WindowId } from '@/shared/types/window.types'

export type SnapPreviewRegion = 'left' | 'right' | 'maximize' | null

interface UseDragOptions {
  windowId: WindowId
  onMove: (id: WindowId, x: number, y: number) => void
  onFocus: (id: WindowId) => void
  onMaximize: (id: WindowId) => void
  isMaximized: boolean
  onRestore: (id: WindowId) => void
  onSnapPreviewChange?: (region: SnapPreviewRegion) => void
  onSnapExecute?: (id: WindowId, region: 'left' | 'right' | 'maximize') => void
}

export function useWindowDrag({
  windowId,
  onMove,
  onFocus,
  isMaximized,
  onRestore,
  onSnapPreviewChange,
  onSnapExecute,
}: UseDragOptions) {
  const dragState = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
    dragging: boolean
    currentSnapPreview: SnapPreviewRegion
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return

      e.preventDefault()
      onFocus(windowId)

      if (isMaximized) {
        onRestore(windowId)
      }

      const el = (e.currentTarget as HTMLElement).closest('[data-window]') as HTMLElement
      if (!el) return

      const rect = el.getBoundingClientRect()
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.left,
        origY: rect.top,
        dragging: false,
        currentSnapPreview: null,
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragState.current) return
        const dx = ev.clientX - dragState.current.startX
        const dy = ev.clientY - dragState.current.startY

        if (!dragState.current.dragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          dragState.current.dragging = true
        }

        if (!dragState.current.dragging) return

        let newX = dragState.current.origX + dx
        let newY = dragState.current.origY + dy

        newY = Math.max(0, newY)
        newX = Math.max(-el.offsetWidth + 100, newX)
        newX = Math.min(window.innerWidth - 100, newX)

        onMove(windowId, newX, newY)

        // Snap preview detection
        const EDGE = 8
        let preview: SnapPreviewRegion = null
        if (ev.clientY <= EDGE) preview = 'maximize'
        else if (ev.clientX <= EDGE) preview = 'left'
        else if (ev.clientX >= window.innerWidth - EDGE) preview = 'right'

        if (preview !== dragState.current.currentSnapPreview) {
          dragState.current.currentSnapPreview = preview
          onSnapPreviewChange?.(preview)
        }
      }

      const onPointerUp = () => {
        const snap = dragState.current?.currentSnapPreview
        if (snap) {
          onSnapExecute?.(windowId, snap)
        }
        onSnapPreviewChange?.(null)
        cleanup()
      }

      const cleanup = () => {
        dragState.current = null
        el.style.transform = ''
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [windowId, onMove, onFocus, isMaximized, onRestore, onSnapPreviewChange, onSnapExecute],
  )

  return { onPointerDown }
}
