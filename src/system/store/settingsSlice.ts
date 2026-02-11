import type { StateCreator } from 'zustand'

/* ------------------------------------------------------------------ */
/*  Slice interface                                                    */
/* ------------------------------------------------------------------ */

export interface SettingsSlice {
  theme: 'dark' | 'light'
  accentColor: string
  wallpaper: string

  setTheme: (theme: 'dark' | 'light') => void
  setAccentColor: (color: string) => void
  setWallpaper: (path: string) => void
}

/* ------------------------------------------------------------------ */
/*  Slice creator                                                      */
/* ------------------------------------------------------------------ */

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  /* ---------- state ---------- */
  theme: 'dark',
  accentColor: '#0ea5e9',
  wallpaper: '/assets/wallpapers/Windows/img0.jpg',

  /* ---------- actions ---------- */

  setTheme(theme) {
    set({ theme })
  },

  setAccentColor(color) {
    set({ accentColor: color })
  },

  setWallpaper(path) {
    set({ wallpaper: path })
  },
})
