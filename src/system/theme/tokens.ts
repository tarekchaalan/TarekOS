export interface ThemeTokens {
  'os-bg': string
  'os-bg-secondary': string
  'os-bg-tertiary': string
  'os-surface': string
  'os-surface-hover': string
  'os-border': string
  'os-text': string
  'os-text-secondary': string
  'os-text-muted': string
  'os-accent': string
  'os-accent-hover': string
  'os-accent-muted': string
  'window-bg': string
  'window-titlebar': string
  'window-titlebar-inactive': string
  'window-border': string
  'taskbar-bg': string
  'taskbar-hover': string
  'startmenu-bg': string
  'terminal-bg': string
  'terminal-text': string
  'terminal-prompt': string
}

/** Windows 7 Aero theme */
export const aeroTheme: ThemeTokens = {
  'os-bg': '#1e1e2e',
  'os-bg-secondary': '#f0f0f0',
  'os-bg-tertiary': '#e0e0e0',
  'os-surface': '#ffffff',
  'os-surface-hover': '#e8e8e8',
  'os-border': '#b0b0b0',
  'os-text': '#1a1a1a',
  'os-text-secondary': '#444444',
  'os-text-muted': '#888888',
  'os-accent': '#4580c4',
  'os-accent-hover': '#5a9ae0',
  'os-accent-muted': '#d0e0f0',
  'window-bg': '#f0f0f0',
  'window-titlebar': 'rgba(50,100,180,0.65)',
  'window-titlebar-inactive': 'rgba(185,195,210,0.65)',
  'window-border': 'rgba(80,140,220,0.5)',
  'taskbar-bg': 'rgba(20,40,80,0.75)',
  'taskbar-hover': 'rgba(255,255,255,0.15)',
  'startmenu-bg': 'rgba(255,255,255,0.97)',
  'terminal-bg': '#0c0c0c',
  'terminal-text': '#cccccc',
  'terminal-prompt': '#16c60c',
}

// Keep dark/light as aliases for backward compat
export const darkTheme = aeroTheme
export const lightTheme = aeroTheme
