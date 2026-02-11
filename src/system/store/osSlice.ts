import type { StateCreator } from 'zustand'

/* ------------------------------------------------------------------ */
/*  Slice interface                                                    */
/* ------------------------------------------------------------------ */

export interface OsSlice {
  startMenuOpen: boolean
  searchOpen: boolean
  desktopFocused: boolean
  showShutdown: boolean

  toggleStartMenu: () => void
  openSearch: () => void
  closeOverlays: () => void
  setDesktopFocused: (focused: boolean) => void
  requestShutdown: () => void
  cancelShutdown: () => void
}

/* ------------------------------------------------------------------ */
/*  Slice creator                                                      */
/* ------------------------------------------------------------------ */

export const createOsSlice: StateCreator<OsSlice, [], [], OsSlice> = (set) => ({
  /* ---------- state ---------- */
  startMenuOpen: false,
  searchOpen: false,
  desktopFocused: true,
  showShutdown: false,

  /* ---------- actions ---------- */

  toggleStartMenu() {
    set((s) => {
      const opening = !s.startMenuOpen
      return {
        startMenuOpen: opening,
        // If opening the start menu, close search
        searchOpen: opening ? false : s.searchOpen,
      }
    })
  },

  openSearch() {
    set({ searchOpen: true, startMenuOpen: true })
  },

  closeOverlays() {
    set({ startMenuOpen: false, searchOpen: false, desktopFocused: false })
  },

  setDesktopFocused(focused) {
    set({ desktopFocused: focused })
  },

  requestShutdown() {
    set({ showShutdown: true, startMenuOpen: false, searchOpen: false })
  },

  cancelShutdown() {
    set({ showShutdown: false })
  },
})
