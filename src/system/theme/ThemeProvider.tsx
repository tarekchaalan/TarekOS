import { useEffect, type ReactNode } from 'react'
import { aeroTheme } from './tokens'

function applyTheme(_theme: 'dark' | 'light', accent: string) {
  const tokens = aeroTheme
  const root = document.documentElement
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--color-${key}`, value)
  }
  root.style.setProperty('--color-os-accent', accent)
  root.style.setProperty('--color-os-accent-hover', adjustBrightness(accent, 20))
}

function adjustBrightness(hex: string, percent: number): string {
  // Handle non-hex values (rgba, etc.) — just return as-is
  if (!hex.startsWith('#')) return hex
  const num = parseInt(hex.replace('#', ''), 16)
  const adj = Math.round(255 * (percent / 100))
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + adj))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + adj))
  const b = Math.min(255, Math.max(0, (num & 0xff) + adj))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Apply Aero theme immediately
  useEffect(() => {
    applyTheme('dark', '#4580c4')
  }, [])

  return <>{children}</>
}

// Direct function to update theme from store subscription
export { applyTheme }
