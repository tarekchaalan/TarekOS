import { useCallback, useRef } from 'react'
import type { WindowId, WindowRect } from '@/shared/types/window.types'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface UseResizeOptions {
  windowId: WindowId
  rect: WindowRect
  minW: number
  minH: number
  onResize: (id: WindowId, rect: WindowRect) => void
  onFocus: (id: WindowId) => void
}

export function useWindowResize({
  windowId,
  rect,
  minW,
  minH,
  onResize,
  onFocus,
}: UseResizeOptions) {
  const resizeState = useRef<{
    direction: ResizeDirection
    startX: number
    startY: number
    origRect: WindowRect
  } | null>(null)

  const onResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      onFocus(windowId)

      resizeState.current = {
        direction,
        startX: e.clientX,
        startY: e.clientY,
        origRect: { ...rect },
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (!resizeState.current) return

        const { direction: dir, startX, startY, origRect } = resizeState.current
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        let { x, y, w, h } = origRect

        if (dir.includes('e')) w = Math.max(minW, origRect.w + dx)
        if (dir.includes('w')) {
          const newW = Math.max(minW, origRect.w - dx)
          x = origRect.x + origRect.w - newW
          w = newW
        }
        if (dir.includes('s')) h = Math.max(minH, origRect.h + dy)
        if (dir.includes('n')) {
          const newH = Math.max(minH, origRect.h - dy)
          y = origRect.y + origRect.h - newH
          h = newH
        }

        onResize(windowId, { x, y, w, h })
      }

      const onPointerUp = () => {
        resizeState.current = null
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [windowId, rect, minW, minH, onResize, onFocus],
  )

  return { onResizeStart }
}
