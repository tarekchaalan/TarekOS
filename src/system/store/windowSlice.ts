import type { StateCreator } from 'zustand'
import type {
  WindowId,
  WindowMode,
  SnapRegion,
  WindowRect,
  WindowInstance,
} from '@/shared/types/window.types'
import { generateWindowId } from '@/shared/utils/id'
import { playSound } from '@/system/sounds/sounds'

/* Re-export types used by consumers of this slice */
export type { WindowId, WindowMode, SnapRegion, WindowRect, WindowInstance }

/* ------------------------------------------------------------------ */
/*  Slice interface                                                    */
/* ------------------------------------------------------------------ */

export interface WindowSlice {
  windows: Record<WindowId, WindowInstance>
  focusedWindowId: WindowId | null
  zCounter: number

  openWindow: (opts: {
    appId: string
    title: string
    icon?: string
    rect: WindowRect
    minW: number
    minH: number
    resizable?: boolean
    payload?: unknown
  }) => WindowId

  closeWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  maximizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
  moveWindow: (id: WindowId, x: number, y: number) => void
  resizeWindow: (id: WindowId, rect: WindowRect) => void
  snapWindow: (id: WindowId, region: SnapRegion) => void
  updateWindowTitle: (id: WindowId, title: string) => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CASCADE_STEP = 30
const CASCADE_RESET = 5

let cascadeIndex = 0

function nextCascadeOffset(): { x: number; y: number } {
  const offset = cascadeIndex * CASCADE_STEP
  cascadeIndex = (cascadeIndex + 1) % CASCADE_RESET
  return { x: offset, y: offset }
}

/** Return the id of the visible window with the highest z, or null. */
function topmostWindowId(
  windows: Record<WindowId, WindowInstance>,
  exclude?: WindowId,
): WindowId | null {
  let best: WindowInstance | null = null
  for (const w of Object.values(windows)) {
    if (w.id === exclude) continue
    if (w.mode === 'minimized') continue
    if (!best || w.z > best.z) best = w
  }
  return best?.id ?? null
}

function now(): number {
  return Date.now()
}

/* ------------------------------------------------------------------ */
/*  Slice creator                                                      */
/* ------------------------------------------------------------------ */

export const createWindowSlice: StateCreator<WindowSlice, [], [], WindowSlice> = (
  set,
  get,
) => ({
  /* ---------- state ---------- */
  windows: {},
  focusedWindowId: null,
  zCounter: 0,

  /* ---------- actions ---------- */

  openWindow(opts) {
    const id = generateWindowId()
    const cascade = nextCascadeOffset()
    playSound('click')

    set((s) => {
      const z = s.zCounter + 1

      // Unfocus the previously focused window
      const updated: Record<WindowId, WindowInstance> = {}
      for (const [wid, win] of Object.entries(s.windows)) {
        updated[wid] = win.focused ? { ...win, focused: false } : win
      }

      const instance: WindowInstance = {
        id,
        appId: opts.appId,
        title: opts.title,
        icon: opts.icon,
        mode: 'normal',
        snap: 'none',
        rect: {
          x: opts.rect.x + cascade.x,
          y: opts.rect.y + cascade.y,
          w: opts.rect.w,
          h: opts.rect.h,
        },
        z,
        focused: true,
        resizable: opts.resizable ?? true,
        draggable: true,
        minW: opts.minW,
        minH: opts.minH,
        createdAt: now(),
        updatedAt: now(),
        payload: opts.payload,
      }

      updated[id] = instance
      return { windows: updated, focusedWindowId: id, zCounter: z }
    })

    return id
  },

  closeWindow(id) {
    playSound('click')
    set((s) => {
      const { [id]: _removed, ...remaining } = s.windows
      const nextFocused =
        s.focusedWindowId === id ? topmostWindowId(remaining) : s.focusedWindowId

      // Mark the new topmost as focused
      const updated: Record<WindowId, WindowInstance> = {}
      for (const [wid, win] of Object.entries(remaining)) {
        updated[wid] =
          wid === nextFocused
            ? { ...win, focused: true, updatedAt: now() }
            : win.focused
              ? { ...win, focused: false }
              : win
      }

      return { windows: updated, focusedWindowId: nextFocused }
    })
  },

  focusWindow(id) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      const z = s.zCounter + 1
      const updated: Record<WindowId, WindowInstance> = {}

      for (const [wid, win] of Object.entries(s.windows)) {
        if (wid === id) {
          updated[wid] = {
            ...win,
            focused: true,
            z,
            // Restore from minimized if needed
            mode: win.mode === 'minimized' ? 'normal' : win.mode,
            updatedAt: now(),
          }
        } else {
          updated[wid] = win.focused ? { ...win, focused: false } : win
        }
      }

      return { windows: updated, focusedWindowId: id, zCounter: z }
    })
  },

  minimizeWindow(id) {
    playSound('minimize')
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      const updated: Record<WindowId, WindowInstance> = {}
      for (const [wid, win] of Object.entries(s.windows)) {
        if (wid === id) {
          updated[wid] = {
            ...win,
            mode: 'minimized' as WindowMode,
            focused: false,
            updatedAt: now(),
          }
        } else {
          updated[wid] = win
        }
      }

      const nextFocused =
        s.focusedWindowId === id ? topmostWindowId(updated) : s.focusedWindowId

      // Set the new topmost as focused
      if (nextFocused && updated[nextFocused]) {
        updated[nextFocused] = {
          ...updated[nextFocused],
          focused: true,
          updatedAt: now(),
        }
      }

      return { windows: updated, focusedWindowId: nextFocused }
    })
  },

  maximizeWindow(id) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      return {
        windows: {
          ...s.windows,
          [id]: {
            ...target,
            mode: 'maximized' as WindowMode,
            restoreRect: target.restoreRect ?? { ...target.rect },
            updatedAt: now(),
          },
        },
      }
    })
  },

  restoreWindow(id) {
    const state = get()
    const target = state.windows[id]
    if (!target) return

    if (target.mode === 'maximized') {
      set((s) => ({
        windows: {
          ...s.windows,
          [id]: {
            ...target,
            mode: 'normal' as WindowMode,
            snap: 'none' as SnapRegion,
            rect: target.restoreRect ?? target.rect,
            restoreRect: undefined,
            updatedAt: now(),
          },
        },
      }))
    } else if (target.mode === 'minimized') {
      // Restore from minimized -- delegate to focusWindow which handles z + focus
      get().focusWindow(id)
    }
  },

  moveWindow(id, x, y) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      return {
        windows: {
          ...s.windows,
          [id]: {
            ...target,
            rect: { ...target.rect, x, y },
            updatedAt: now(),
          },
        },
      }
    })
  },

  resizeWindow(id, rect) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      return {
        windows: {
          ...s.windows,
          [id]: { ...target, rect, updatedAt: now() },
        },
      }
    })
  },

  snapWindow(id, region) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      return {
        windows: {
          ...s.windows,
          [id]: {
            ...target,
            snap: region,
            restoreRect: target.restoreRect ?? { ...target.rect },
            updatedAt: now(),
          },
        },
      }
    })
  },

  updateWindowTitle(id, title) {
    set((s) => {
      const target = s.windows[id]
      if (!target) return s

      return {
        windows: {
          ...s.windows,
          [id]: { ...target, title, updatedAt: now() },
        },
      }
    })
  },
})
