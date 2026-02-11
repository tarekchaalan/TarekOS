export interface ShortcutDef {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  action: string
  description: string
}

/**
 * Reliable shortcuts — these use Ctrl/Shift combos the browser won't intercept.
 */
export const reliableShortcuts: ShortcutDef[] = [
  {
    key: 'Escape',
    action: 'close-overlay',
    description: 'Close topmost overlay or unfocus window',
  },
  {
    key: ' ',
    ctrl: true,
    action: 'open-search',
    description: 'Open Start Menu search',
  },
  {
    key: 'Tab',
    ctrl: true,
    action: 'cycle-window-next',
    description: 'Focus next window',
  },
  {
    key: 'Tab',
    ctrl: true,
    shift: true,
    action: 'cycle-window-prev',
    description: 'Focus previous window',
  },
]

/**
 * Best-effort shortcuts — OS/browser may intercept these.
 */
export const bestEffortShortcuts: ShortcutDef[] = [
  {
    key: 'Meta',
    action: 'toggle-start-menu',
    description: 'Toggle start menu',
  },
  {
    key: 'F4',
    alt: true,
    action: 'close-window',
    description: 'Close focused window',
  },
  {
    key: 'd',
    meta: true,
    action: 'minimize-all',
    description: 'Show desktop (minimize all)',
  },
]

export function matchShortcut(
  e: KeyboardEvent,
  shortcuts: ShortcutDef[],
): ShortcutDef | null {
  for (const s of shortcuts) {
    const keyMatch = e.key === s.key || e.key.toLowerCase() === s.key.toLowerCase()
    const ctrlMatch = !!s.ctrl === e.ctrlKey
    const altMatch = !!s.alt === e.altKey
    const shiftMatch = !!s.shift === e.shiftKey
    const metaMatch = !!s.meta === e.metaKey

    // Meta key standalone check
    if (s.key === 'Meta' && e.key === 'Meta') return s

    if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
      return s
    }
  }
  return null
}
