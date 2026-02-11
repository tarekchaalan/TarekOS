import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { WindowSlice } from './windowSlice'
import type { OsSlice } from './osSlice'
import type { SettingsSlice } from './settingsSlice'

import { createWindowSlice } from './windowSlice'
import { createOsSlice } from './osSlice'
import { createSettingsSlice } from './settingsSlice'

/* ------------------------------------------------------------------ */
/*  Combined store type                                                */
/* ------------------------------------------------------------------ */

export type StoreState = WindowSlice & OsSlice & SettingsSlice

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createWindowSlice(...(a as Parameters<typeof createWindowSlice>)),
      ...createOsSlice(...(a as Parameters<typeof createOsSlice>)),
      ...createSettingsSlice(...(a as Parameters<typeof createSettingsSlice>)),
    }),
    {
      name: 'tarekos-settings',
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        wallpaper: state.wallpaper,
      }),
    },
  ),
)

/* ------------------------------------------------------------------ */
/*  Re-exports for convenience                                         */
/* ------------------------------------------------------------------ */

export type { WindowSlice } from './windowSlice'
export type { OsSlice } from './osSlice'
export type { SettingsSlice } from './settingsSlice'
