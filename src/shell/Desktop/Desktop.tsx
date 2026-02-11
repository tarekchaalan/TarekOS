import { useCallback, useEffect, useState } from 'react'
import { useStore } from '@/system/store'
import { vfs } from '@/system/vfs/vfs.seed'
import { resolveTarget, getAppDefinition } from '@/system/openTarget'
import { applyTheme } from '@/system/theme/ThemeProvider'
import { playSound } from '@/system/sounds/sounds'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'
import { WindowLayer } from '@/shell/WindowManager/WindowLayer'
import { Taskbar } from '@/shell/Taskbar/Taskbar'
import { StartMenu } from '@/shell/StartMenu/StartMenu'
import { ShutdownOverlay } from '@/shell/ShutdownOverlay/ShutdownOverlay'
import { ContextMenu } from '@/shell/ContextMenu/ContextMenu'
import { useContextMenu } from '@/shell/ContextMenu/useContextMenu'
import type { MenuEntry } from '@/shell/ContextMenu/ContextMenu'
import { AltTabSwitcher } from '@/shell/AltTabSwitcher/AltTabSwitcher'
import { subscribeAltTab, commitAltTab } from '@/shell/AltTabSwitcher/altTabState'
import type { AltTabState } from '@/shell/AltTabSwitcher/altTabState'
import { DesktopIcon } from './DesktopIcon'

export function Desktop() {
  const wallpaper = useStore((s) => s.wallpaper)
  const theme = useStore((s) => s.theme)
  const accentColor = useStore((s) => s.accentColor)
  const openWindow = useStore((s) => s.openWindow)
  const closeOverlays = useStore((s) => s.closeOverlays)
  const startMenuOpen = useStore((s) => s.startMenuOpen)
  const showShutdown = useStore((s) => s.showShutdown)
  const windows = useStore((s) => s.windows)

  const ctxMenu = useContextMenu()

  // Alt+Tab switcher state (module-level pub/sub)
  const [altTab, setAltTab] = useState<AltTabState>(null)
  useEffect(() => subscribeAltTab(setAltTab), [])

  // Resolve alt-tab window instances from ids
  const altTabWindows = altTab
    ? altTab.windowIds
        .map((id) => windows[id])
        .filter(Boolean)
    : []

  const handleAltTabSelect = useCallback(
    (id: string) => {
      // Clicking a card directly commits that window
      commitAltTab()
      if (id) {
        useStore.getState().focusWindow(id)
      }
    },
    [],
  )

  // Apply theme changes
  useEffect(() => {
    applyTheme(theme as 'dark' | 'light', accentColor)
  }, [theme, accentColor])

  // Play startup sound on mount (best-effort — blocked if no prior interaction)
  useEffect(() => {
    playSound('startup')
  }, [])

  // Get desktop icons from VFS
  const desktopItems = vfs.getDesktopItems()

  // Icon positions — initialized from VFS with Recycle Bin at bottom-right
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    const desktopHeight = window.innerHeight - TASKBAR_HEIGHT
    for (const item of desktopItems) {
      if (item.id === 'sc_recycle') {
        positions[item.id] = { x: window.innerWidth - 96, y: desktopHeight - 110 }
      } else {
        positions[item.id] = { x: item.desktop?.x ?? 40, y: item.desktop?.y ?? 40 }
      }
    }
    return positions
  })

  const handleIconMove = useCallback((nodeId: string, x: number, y: number) => {
    setIconPositions((prev) => ({ ...prev, [nodeId]: { x, y } }))
  }, [])

  // Helper: open app by resolving target
  const openApp = useCallback(
    (node: VfsTreeNode) => {
      let targetNode = node
      if (node.type === 'shortcut' && node.target) {
        if (node.target.kind === 'node' && node.target.nodeId) {
          const resolved = vfs.getNode(node.target.nodeId)
          if (resolved) targetNode = resolved
        }
      }

      const result = resolveTarget(
        targetNode.type === 'shortcut' && targetNode.target?.kind === 'app'
          ? { kind: 'app', appId: targetNode.target.appId! }
          : { kind: 'node', node: targetNode },
      )

      if (!result) return

      const appDef = getAppDefinition(result.appId)
      if (!appDef) return

      if (appDef.singleton) {
        const existing = Object.values(windows).find((w) => w.appId === result.appId)
        if (existing) {
          useStore.getState().focusWindow(existing.id)
          return
        }
      }

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
        payload: result.payload,
      })
    },
    [openWindow, windows],
  )

  const handleIconDoubleClick = useCallback(
    (node: VfsTreeNode) => openApp(node),
    [openApp],
  )

  // Desktop background context menu
  const handleDesktopContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const items: MenuEntry[] = [
        {
          label: 'View',
          icon: '🖥',
          action: () => {},
          disabled: true,
        },
        {
          label: 'Refresh',
          icon: '🔄',
          action: () => window.location.reload(),
        },
        { separator: true },
        {
          label: 'Personalize',
          icon: '🎨',
          action: () => {
            const result = resolveTarget({ kind: 'app', appId: 'app.settings' })
            if (!result) return
            const appDef = getAppDefinition(result.appId)
            if (!appDef) return
            const existing = Object.values(useStore.getState().windows).find((w) => w.appId === 'app.settings')
            if (existing) {
              useStore.getState().focusWindow(existing.id)
              return
            }
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
          },
        },
      ]
      ctxMenu.show(e.clientX, e.clientY, items)
    },
    [ctxMenu, openWindow],
  )

  // File/icon context menu
  const handleIconContextMenu = useCallback(
    (e: React.MouseEvent, node: VfsTreeNode) => {
      const items: MenuEntry[] = [
        {
          label: 'Open',
          icon: '📂',
          action: () => openApp(node),
        },
        { separator: true },
        {
          label: 'Properties',
          icon: '📋',
          action: () => {
            // Open notepad showing info about this node
            const info = `Name: ${node.name}\nType: ${node.type}\n${node.mime ? `MIME: ${node.mime}\n` : ''}Path: ${vfs.getPath(node)}`
            const appDef = getAppDefinition('app.notepad')
            if (!appDef) return
            openWindow({
              appId: 'app.notepad',
              title: `${node.name} - Properties`,
              icon: 'icon.notepad',
              rect: {
                x: e.clientX,
                y: e.clientY,
                w: 400,
                h: 300,
              },
              minW: appDef.defaultWindow.minW,
              minH: appDef.defaultWindow.minH,
              payload: { text: info },
            })
          },
        },
      ]
      ctxMenu.show(e.clientX, e.clientY, items)
    },
    [ctxMenu, openApp, openWindow],
  )

  const handleDesktopClick = useCallback(() => {
    closeOverlays()
    ctxMenu.close()
    // Unfocus all windows
    const state = useStore.getState()
    if (state.focusedWindowId) {
      useStore.setState({
        focusedWindowId: null,
        windows: Object.fromEntries(
          Object.entries(state.windows).map(([id, w]) => [id, { ...w, focused: false }]),
        ),
      })
    }
  }, [closeOverlays, ctxMenu])

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        paddingBottom: TASKBAR_HEIGHT,
      }}
    >
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wallpaper})` }}
        onClick={handleDesktopClick}
        onContextMenu={handleDesktopContextMenu}
      />

      {/* Fallback gradient (Win7 blue) if no wallpaper loads */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#245edb] via-[#1a4ab0] to-[#0f2d6e]"
        style={{ zIndex: -1 }}
      />

      {/* Desktop icons */}
      <div className="relative" style={{ height: `calc(100vh - ${TASKBAR_HEIGHT}px)` }}>
        {desktopItems.map((node) => (
          <DesktopIcon
            key={node.id}
            node={node}
            position={iconPositions[node.id] ?? { x: node.desktop?.x ?? 40, y: node.desktop?.y ?? 40 }}
            onMove={handleIconMove}
            onDoubleClick={handleIconDoubleClick}
            onContextMenu={handleIconContextMenu}
          />
        ))}

        {/* Window layer */}
        <WindowLayer />
      </div>

      {/* Alt+Tab switcher overlay */}
      {altTab?.active && altTabWindows.length > 0 && (
        <AltTabSwitcher
          windows={altTabWindows}
          selectedIndex={altTab.selectedIndex}
          onSelect={handleAltTabSelect}
        />
      )}

      {/* Start menu */}
      {startMenuOpen && <StartMenu />}

      {/* Taskbar */}
      <Taskbar />

      {/* Shutdown overlay */}
      {showShutdown && <ShutdownOverlay />}

      {/* Context menu */}
      {ctxMenu.menu && (
        <ContextMenu
          x={ctxMenu.menu.x}
          y={ctxMenu.menu.y}
          items={ctxMenu.menu.items}
          onClose={ctxMenu.close}
        />
      )}
    </div>
  )
}
