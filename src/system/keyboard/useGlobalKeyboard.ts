import { useEffect, useRef } from 'react'
import { useStore } from '@/system/store'
import { reliableShortcuts, bestEffortShortcuts, matchShortcut } from './shortcuts'
import {
  showAltTab,
  cycleAltTab,
  commitAltTab,
  cancelAltTab,
} from '@/shell/AltTabSwitcher/altTabState'

export function useGlobalKeyboard() {
  // Track Meta key press without other keys (for toggle-start-menu)
  const metaDownAlone = useRef(false)
  // Track whether Alt+Tab session is in progress
  const altTabActive = useRef(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Track Meta key solo press
      if (e.key === 'Meta') {
        metaDownAlone.current = true
        return
      }
      // Any other key while Meta is down = not solo
      if (e.metaKey) {
        metaDownAlone.current = false
      }

      // ---- Alt+Tab handling (needs special hold/release logic) ----
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault()
        e.stopPropagation()

        const state = useStore.getState()

        if (!altTabActive.current) {
          // Start a new Alt+Tab session
          // Collect all non-minimized windows sorted by z-order (highest first = most recent)
          const wins = Object.values(state.windows)
            .filter((w) => w.mode !== 'minimized')
            .sort((a, b) => b.z - a.z)

          if (wins.length === 0) return

          const ids = wins.map((w) => w.id)
          altTabActive.current = true
          showAltTab(ids)
          // Immediately cycle to next (index 1) since index 0 is the currently focused window
          if (ids.length > 1) {
            cycleAltTab(e.shiftKey ? -1 : 1)
          }
        } else {
          // Already active — cycle through
          cycleAltTab(e.shiftKey ? -1 : 1)
        }
        return
      }

      // If Alt+Tab is active and Escape is pressed, cancel
      if (e.key === 'Escape' && altTabActive.current) {
        e.preventDefault()
        altTabActive.current = false
        cancelAltTab()
        return
      }

      const state = useStore.getState()

      // Check reliable shortcuts first
      const reliable = matchShortcut(e, reliableShortcuts)
      if (reliable) {
        e.preventDefault()
        executeAction(reliable.action, state)
        return
      }

      // Check best-effort shortcuts
      const bestEffort = matchShortcut(e, bestEffortShortcuts)
      if (bestEffort && bestEffort.key !== 'Meta') {
        e.preventDefault()
        executeAction(bestEffort.action, state)
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      // Alt key released — commit Alt+Tab selection
      if (e.key === 'Alt' && altTabActive.current) {
        altTabActive.current = false
        const selectedId = commitAltTab()
        if (selectedId) {
          useStore.getState().focusWindow(selectedId)
        }
        return
      }

      // Meta key released without pressing any other key = toggle start menu
      if (e.key === 'Meta' && metaDownAlone.current) {
        metaDownAlone.current = false
        useStore.getState().toggleStartMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
}

function executeAction(
  action: string,
  state: ReturnType<typeof useStore.getState>,
) {
  switch (action) {
    case 'close-overlay': {
      if (state.startMenuOpen) {
        state.closeOverlays()
      } else if (state.focusedWindowId) {
        state.closeWindow(state.focusedWindowId)
      }
      break
    }

    case 'open-search': {
      state.openSearch()
      break
    }

    case 'cycle-window-next': {
      cycleWindow(state, 'next')
      break
    }

    case 'cycle-window-prev': {
      cycleWindow(state, 'prev')
      break
    }

    case 'toggle-start-menu': {
      state.toggleStartMenu()
      break
    }

    case 'close-window': {
      if (state.focusedWindowId) {
        state.closeWindow(state.focusedWindowId)
      }
      break
    }

    case 'minimize-all': {
      for (const win of Object.values(state.windows)) {
        if (win.mode !== 'minimized') {
          state.minimizeWindow(win.id)
        }
      }
      break
    }
  }
}

function cycleWindow(
  state: ReturnType<typeof useStore.getState>,
  direction: 'next' | 'prev',
) {
  const wins = Object.values(state.windows).sort((a, b) => a.z - b.z)
  if (wins.length === 0) return

  const currentIdx = wins.findIndex((w) => w.id === state.focusedWindowId)
  let nextIdx: number

  if (direction === 'next') {
    nextIdx = currentIdx < wins.length - 1 ? currentIdx + 1 : 0
  } else {
    nextIdx = currentIdx > 0 ? currentIdx - 1 : wins.length - 1
  }

  state.focusWindow(wins[nextIdx].id)
}
