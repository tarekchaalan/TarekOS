/** Module-level pub/sub state for Alt+Tab switcher (same pattern as toasts). */

export type AltTabState = {
  active: boolean
  windowIds: string[]
  selectedIndex: number
} | null

let state: AltTabState = null
let listeners: ((s: AltTabState) => void)[] = []

function notify() {
  for (const fn of listeners) fn(state)
}

/** Show the Alt+Tab overlay with the given ordered window ids. */
export function showAltTab(windowIds: string[]) {
  if (windowIds.length === 0) return
  state = { active: true, windowIds, selectedIndex: 0 }
  notify()
}

/** Cycle the selection forward (+1) or backward (-1). */
export function cycleAltTab(dir: 1 | -1) {
  if (!state) return
  const len = state.windowIds.length
  state = {
    ...state,
    selectedIndex: ((state.selectedIndex + dir) % len + len) % len,
  }
  notify()
}

/** Read the current state (snapshot). */
export function getAltTabState() {
  return state
}

/** Commit the current selection: hide the overlay and return the selected window id. */
export function commitAltTab(): string | null {
  if (!state) return null
  const id = state.windowIds[state.selectedIndex]
  state = null
  notify()
  return id
}

/** Cancel without committing. */
export function cancelAltTab() {
  state = null
  notify()
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribeAltTab(fn: (s: AltTabState) => void) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}
