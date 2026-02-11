import { useState, useCallback } from 'react'
import type { MenuEntry } from './ContextMenu'

interface ContextMenuState {
  x: number
  y: number
  items: MenuEntry[]
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const show = useCallback((x: number, y: number, items: MenuEntry[]) => {
    setMenu({ x, y, items })
  }, [])

  const close = useCallback(() => {
    setMenu(null)
  }, [])

  return { menu, show, close }
}
