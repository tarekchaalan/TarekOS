import { useCallback, useMemo, useState } from 'react'
import { useStore } from '@/system/store'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import { getAppDefinition, getAppRegistry, resolveTarget } from '@/system/openTarget'
import type { WindowInstance } from '@/shared/types/window.types'
import { TaskbarButton } from './TaskbarButton'
import { SystemTray } from './SystemTray'

/* Start orb image paths */
const START_ORB_DEFAULT = '/assets/icons/startIcon_default.png'
const START_ORB_HOVER = '/assets/icons/startIcon_hover.png'
const START_ORB_PRESSED = '/assets/icons/startIcon_pressed.png'

export function Taskbar() {
  const windows = useStore((s) => s.windows)
  const startMenuOpen = useStore((s) => s.startMenuOpen)
  const toggleStartMenu = useStore((s) => s.toggleStartMenu)
  const focusWindow = useStore((s) => s.focusWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const openWindow = useStore((s) => s.openWindow)

  const registry = getAppRegistry()
  const pinnedAppIds = registry.taskbar.pinned

  // Group windows by appId
  const windowsByApp = useMemo(() => {
    const map = new Map<string, WindowInstance[]>()
    for (const win of Object.values(windows)) {
      const list = map.get(win.appId) ?? []
      list.push(win)
      map.set(win.appId, list)
    }
    return map
  }, [windows])

  // Build combined list: pinned apps first, then running non-pinned apps
  const taskbarItems = useMemo(() => {
    const items: { appId: string; icon?: string; label: string; windows: WindowInstance[]; isPinned: boolean }[] = []

    // Pinned apps
    for (const appId of pinnedAppIds) {
      const appDef = getAppDefinition(appId)
      items.push({
        appId,
        icon: appDef?.icon,
        label: appDef?.name ?? appId,
        windows: windowsByApp.get(appId) ?? [],
        isPinned: true,
      })
    }

    // Running non-pinned apps
    for (const [appId, wins] of windowsByApp.entries()) {
      if (pinnedAppIds.includes(appId)) continue
      const appDef = getAppDefinition(appId)
      items.push({
        appId,
        icon: appDef?.icon,
        label: appDef?.name ?? appId,
        windows: wins,
        isPinned: false,
      })
    }

    return items
  }, [pinnedAppIds, windowsByApp])

  const handleClickApp = useCallback(
    (appId: string) => {
      const appWindows = windowsByApp.get(appId) ?? []

      if (appWindows.length === 0) {
        // Open the app
        const result = resolveTarget({ kind: 'app', appId })
        if (!result) return
        const appDef = getAppDefinition(result.appId)
        if (!appDef) return

        openWindow({
          appId: result.appId,
          title: result.title,
          icon: result.icon,
          rect: {
            x: Math.max(100, (window.innerWidth - appDef.defaultWindow.w) / 2),
            y: Math.max(50, (window.innerHeight - TASKBAR_HEIGHT - appDef.defaultWindow.h) / 2),
            w: appDef.defaultWindow.w,
            h: appDef.defaultWindow.h,
          },
          minW: appDef.defaultWindow.minW,
          minH: appDef.defaultWindow.minH,
        })
        return
      }

      if (appWindows.length === 1) {
        const win = appWindows[0]
        if (win.focused && win.mode !== 'minimized') {
          minimizeWindow(win.id)
        } else {
          focusWindow(win.id)
        }
        return
      }

      // Multiple windows: focus the topmost non-focused one
      const unfocused = appWindows.filter((w) => !w.focused)
      if (unfocused.length > 0) {
        unfocused.sort((a, b) => b.z - a.z)
        focusWindow(unfocused[0].id)
      } else {
        for (const w of appWindows) {
          minimizeWindow(w.id)
        }
      }
    },
    [windowsByApp, focusWindow, minimizeWindow, openWindow],
  )

  // Show Desktop — minimize all windows
  const handleShowDesktop = useCallback(() => {
    for (const win of Object.values(windows)) {
      if (win.mode !== 'minimized') {
        minimizeWindow(win.id)
      }
    }
  }, [windows, minimizeWindow])

  /* Start orb hover / pressed state */
  const [orbHovered, setOrbHovered] = useState(false)
  const [orbPressed, setOrbPressed] = useState(false)

  const orbSrc = orbPressed || startMenuOpen
    ? START_ORB_PRESSED
    : orbHovered
      ? START_ORB_HOVER
      : START_ORB_DEFAULT

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center"
      style={{
        height: TASKBAR_HEIGHT,
        background: 'linear-gradient(180deg, rgba(40,60,110,0.88) 0%, rgba(15,30,65,0.92) 50%, rgba(10,22,50,0.95) 100%)',
        borderTop: '1px solid rgba(120,160,220,0.35)',
        boxShadow: 'inset 0 1px 0 rgba(150,190,255,0.15)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      }}
      role="toolbar"
      aria-label="Taskbar"
    >
      {/* Subtle highlight line at top */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0"
        style={{
          height: 1,
          background: 'linear-gradient(90deg, rgba(130,180,255,0.1) 0%, rgba(180,210,255,0.3) 50%, rgba(130,180,255,0.1) 100%)',
        }}
      />

      {/* Start Orb button — protrudes above taskbar like Win7 */}
      <button
        className="relative z-10 flex items-center justify-center"
        style={{
          width: 54,
          height: 54,
          marginTop: -14,
          marginLeft: 0,
          marginRight: -2,
          background: 'none',
          border: 'none',
          padding: 0,
          filter: orbPressed || startMenuOpen
            ? 'drop-shadow(0 0 6px rgba(60,140,255,0.5))'
            : orbHovered
              ? 'drop-shadow(0 0 8px rgba(100,180,255,0.6))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          transition: 'filter 0.15s ease',
        }}
        onClick={toggleStartMenu}
        onMouseEnter={() => setOrbHovered(true)}
        onMouseLeave={() => { setOrbHovered(false); setOrbPressed(false) }}
        onMouseDown={() => setOrbPressed(true)}
        onMouseUp={() => setOrbPressed(false)}
        aria-label="Start menu"
        aria-expanded={startMenuOpen}
      >
        <img
          src={orbSrc}
          alt="Start"
          width={50}
          height={50}
          draggable={false}
          className="pointer-events-none"
        />
      </button>

      {/* App buttons */}
      <div className="flex flex-1 items-center gap-0.5 overflow-x-auto px-1" style={{ height: TASKBAR_HEIGHT }}>
        {taskbarItems.map((item) => (
          <TaskbarButton
            key={item.appId}
            appId={item.appId}
            icon={item.icon}
            label={item.label}
            windows={item.windows}
            isPinned={item.isPinned}
            onClickApp={handleClickApp}
          />
        ))}
      </div>

      {/* System tray */}
      <SystemTray />

      {/* Show Desktop strip */}
      <button
        className="h-full w-[10px] transition-colors hover:bg-[rgba(255,255,255,0.12)]"
        style={{
          borderLeft: '1px solid rgba(130,170,230,0.25)',
        }}
        onClick={handleShowDesktop}
        title="Show Desktop"
        aria-label="Show Desktop"
      />
    </div>
  )
}
