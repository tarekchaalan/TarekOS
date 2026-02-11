import type { WindowId, WindowInstance } from './window.types'

export interface OSState {
  focusedWindowId: WindowId | null
  windows: Record<WindowId, WindowInstance>
  zCounter: number

  startMenuOpen: boolean
  searchOpen: boolean
  desktopFocused: boolean
}
