import { useCallback, useRef, useMemo, useState } from 'react'
import { useStore } from '@/system/store'
import { getAppDefinition, getAppRegistry, resolveTarget } from '@/system/openTarget'
import { vfs } from '@/system/vfs/vfs.seed'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { Win7Icon } from '@/shared/components/Win7Icon'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'

/* ------------------------------------------------------------------ */
/*  Right-column quick-links                                           */
/* ------------------------------------------------------------------ */

const rightColumnLinks: Array<{
  label: string
  icon: string
  action: { kind: 'app'; appId: string; payload?: unknown } | { kind: 'node'; path: string }
}> = [
  { label: 'Computer', icon: 'icon.mycomputer', action: { kind: 'app', appId: 'app.explorer' } },
  { label: 'Documents', icon: 'icon.documents', action: { kind: 'app', appId: 'app.explorer', payload: { path: '/Users/Tarek/Documents' } } },
  { label: 'Pictures', icon: 'icon.pictures', action: { kind: 'app', appId: 'app.explorer', payload: { path: '/Users/Tarek/Media' } } },
  { label: 'Games', icon: 'icon.games', action: { kind: 'app', appId: 'app.explorer', payload: { path: '/Users/Tarek/Games' } } },
  { label: 'Control Panel', icon: 'icon.controlPanel', action: { kind: 'app', appId: 'app.settings' } },
]

/* ------------------------------------------------------------------ */
/*  Start Menu Component                                               */
/* ------------------------------------------------------------------ */

export function StartMenu() {
  const closeOverlays = useStore((s) => s.closeOverlays)
  const openWindow = useStore((s) => s.openWindow)
  const windows = useStore((s) => s.windows)

  const menuRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllPrograms, setShowAllPrograms] = useState(false)

  useClickOutside(menuRef, closeOverlays)

  const registry = getAppRegistry()
  const pinnedAppIds = registry.startMenu.pinned

  const handleOpenApp = useCallback(
    (appId: string, payload?: unknown) => {
      const result = resolveTarget({ kind: 'app', appId })
      if (!result) return
      const appDef = getAppDefinition(result.appId)
      if (!appDef) return

      // Check singleton
      if (appDef.singleton) {
        const existing = Object.values(windows).find((w) => w.appId === result.appId)
        if (existing) {
          useStore.getState().focusWindow(existing.id)
          closeOverlays()
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
        payload: payload ?? result.payload,
      })
      closeOverlays()
    },
    [openWindow, closeOverlays, windows],
  )

  const handleOpenNode = useCallback(
    (node: VfsTreeNode) => {
      const result = resolveTarget(
        node.type === 'shortcut' && node.target?.kind === 'app'
          ? { kind: 'app', appId: node.target.appId! }
          : { kind: 'node', node },
      )
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
        payload: result.payload,
      })
      closeOverlays()
    },
    [openWindow, closeOverlays],
  )

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null

    const q = searchQuery.toLowerCase()
    const apps = registry.apps.filter((a) => a.name.toLowerCase().includes(q))
    const files = vfs.find(searchQuery, { max: 10 })

    return { apps, files }
  }, [searchQuery, registry.apps])

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] flex flex-col overflow-hidden rounded-t-lg border border-[rgba(255,255,255,0.2)]"
      style={{
        bottom: TASKBAR_HEIGHT,
        left: 0,
        width: 480,
        maxHeight: `calc(100vh - ${TASKBAR_HEIGHT + 8}px)`,
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
      }}
    >
      {/* ── Top bar: User info ────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(50,100,180,0.85) 0%, rgba(30,70,150,0.75) 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.15)',
        }}
      >
        <img
          src="/assets/profile_photo.png"
          alt="Tarek Chaalan"
          className="h-[42px] w-[42px] rounded border-2 border-white/40 object-cover shadow-md"
          draggable={false}
        />
        <span className="text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          Tarek Chaalan
        </span>
      </div>

      {/* ── Main body: Two columns ───────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — white bg, programs */}
        <div className="flex w-[280px] flex-col overflow-y-auto border-r border-[#d0d0d0] bg-white">
          {searchResults ? (
            <div className="p-2">
              {/* App results */}
              {searchResults.apps.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                    Programs
                  </div>
                  {searchResults.apps.map((app) => (
                    <button
                      key={app.id}
                      className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                      onClick={() => handleOpenApp(app.id)}
                    >
                      <Win7Icon name={app.icon} size={24} />
                      <span className="text-sm">{app.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* File results */}
              {searchResults.files.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#888]">
                    Files
                  </div>
                  {searchResults.files.map((node) => (
                    <button
                      key={node.id}
                      className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                      onClick={() => handleOpenNode(node)}
                    >
                      <Win7Icon name={node.icon ?? 'icon.file'} size={20} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{node.name}</span>
                        <span className="block truncate text-[10px] opacity-60">
                          {vfs.getPath(node)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.apps.length === 0 && searchResults.files.length === 0 && (
                <p className="py-4 text-center text-sm text-[#888]">No results found</p>
              )}
            </div>
          ) : (
            <div className="p-2">
              {showAllPrograms ? (
                <>
                  {/* Back button */}
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                    onClick={() => setShowAllPrograms(false)}
                  >
                    <span className="text-xs opacity-60">◂</span>
                    <span>Back</span>
                  </button>
                  <div className="my-2 border-t border-[#d8d8d8]" />
                  {/* All apps */}
                  {registry.apps.map((app) => (
                    <button
                      key={app.id}
                      className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                      onClick={() => handleOpenApp(app.id)}
                    >
                      <Win7Icon name={app.icon} size={28} />
                      <span className="text-sm">{app.name}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {/* Pinned programs */}
                  {pinnedAppIds.map((appId) => {
                    const appDef = getAppDefinition(appId)
                    if (!appDef) return null
                    return (
                      <button
                        key={appId}
                        className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                        onClick={() => handleOpenApp(appId)}
                      >
                        <Win7Icon name={appDef.icon} size={32} />
                        <div>
                          <span className="block text-sm font-medium">{appDef.name}</span>
                        </div>
                      </button>
                    )
                  })}

                  {/* Separator */}
                  <div className="my-2 border-t border-[#d8d8d8]" />

                  {/* All Programs */}
                  <button
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
                    onClick={() => setShowAllPrograms(true)}
                  >
                    <span>All Programs</span>
                    <span className="text-xs opacity-60">▸</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column — blue-tinted bg, system links */}
        <div
          className="flex w-[200px] flex-col overflow-y-auto p-2"
          style={{ background: 'linear-gradient(180deg, #dce6f4 0%, #c4d5ea 100%)' }}
        >
          {rightColumnLinks.map((link) => (
            <button
              key={link.label}
              className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm text-[#1a3a5c] hover:bg-[#3399ff] hover:text-white"
              onClick={() => {
                if (link.action.kind === 'app') {
                  handleOpenApp(link.action.appId, link.action.payload)
                }
              }}
            >
              <Win7Icon name={link.icon} size={24} />
              <span className="font-medium">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom bar: Search + Shut Down ───────────────── */}
      <div
        className="flex items-center gap-2 border-t border-[#b0b0b0] px-3 py-2"
        style={{ background: 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)' }}
      >
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded border border-[#aaa] bg-white px-2 py-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4.5" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search programs and files"
            className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#aaa]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Shut Down button — Win7 glassy style */}
        <button
          className="flex items-center gap-1 rounded px-3 py-1 text-sm font-medium text-white transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg, rgba(120,160,210,0.9) 0%, rgba(70,110,170,0.95) 50%, rgba(50,90,150,0.95) 100%)',
            border: '1px solid rgba(40,70,120,0.8)',
            textShadow: '0 1px 1px rgba(0,0,0,0.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)',
          }}
          onClick={() => useStore.getState().requestShutdown()}
          title="Shut Down"
        >
          Shut down
        </button>
      </div>
    </div>
  )
}
