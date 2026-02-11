import { Suspense, lazy, useMemo, useState, useCallback } from 'react'
import type { ComponentType } from 'react'
import { useStore } from '@/system/store'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import { WindowFrame } from './WindowFrame'
import { SnapPreview } from './SnapPreview'
import type { SnapPreviewRegion } from './useWindowDrag'

// Lazy-loaded app components
const appComponents: Record<string, () => Promise<{ default: ComponentType<{ windowId: string; payload?: unknown }> }>> = {
  'app.terminal': () => import('@/apps/terminal/TerminalApp'),
  'app.explorer': () => import('@/apps/explorer/ExplorerApp'),
  'app.notepad': () => import('@/apps/notepad/NotepadApp'),
  'app.resumeViewer': () => import('@/apps/resume/ResumeViewerApp'),
  'app.photos': () => import('@/apps/photos/PhotosApp'),
  'app.browser': () => import('@/apps/browser/BrowserApp'),
  'app.settings': () => import('@/apps/settings/SettingsApp'),
  'app.minesweeper': () => import('@/apps/minesweeper/MinesweeperApp'),
  'app.snake': () => import('@/apps/snake/SnakeApp'),
}

// Cache lazy components so they don't re-create on each render
const lazyCache = new Map<string, ComponentType<{ windowId: string; payload?: unknown }>>()

function getLazyComponent(appId: string): ComponentType<{ windowId: string; payload?: unknown }> {
  if (!lazyCache.has(appId)) {
    const loader = appComponents[appId]
    if (loader) {
      lazyCache.set(appId, lazy(loader))
    }
  }
  return lazyCache.get(appId) ?? FallbackApp
}

function FallbackApp({ windowId: _windowId }: { windowId: string; payload?: unknown }) {
  return (
    <div className="flex h-full items-center justify-center bg-os-bg text-os-text-muted">
      Unknown application
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-os-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-os-accent border-t-transparent" />
    </div>
  )
}

export function WindowLayer() {
  const windows = useStore((s) => s.windows)
  const focusWindow = useStore((s) => s.focusWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const maximizeWindow = useStore((s) => s.maximizeWindow)
  const restoreWindow = useStore((s) => s.restoreWindow)
  const moveWindow = useStore((s) => s.moveWindow)
  const resizeWindow = useStore((s) => s.resizeWindow)
  const snapWindow = useStore((s) => s.snapWindow)

  const [snapPreview, setSnapPreview] = useState<SnapPreviewRegion>(null)

  const handleSnapPreviewChange = useCallback((region: SnapPreviewRegion) => {
    setSnapPreview(region)
  }, [])

  const handleSnapExecute = useCallback(
    (id: string, region: 'left' | 'right' | 'maximize') => {
      const h = window.innerHeight - TASKBAR_HEIGHT
      const halfW = Math.floor(window.innerWidth / 2)
      if (region === 'maximize') {
        maximizeWindow(id)
      } else if (region === 'left') {
        resizeWindow(id, { x: 0, y: 0, w: halfW, h })
        snapWindow(id, 'left')
      } else if (region === 'right') {
        resizeWindow(id, { x: halfW, y: 0, w: window.innerWidth - halfW, h })
        snapWindow(id, 'right')
      }
    },
    [maximizeWindow, resizeWindow, snapWindow],
  )

  // Sort windows by z-index, filter out minimized
  const visibleWindows = useMemo(() => {
    return Object.values(windows)
      .filter((w) => w.mode !== 'minimized')
      .sort((a, b) => a.z - b.z)
  }, [windows])

  return (
    <>
      <SnapPreview region={snapPreview} />
      {visibleWindows.map((win) => {
        const AppComponent = getLazyComponent(win.appId)
        return (
          <WindowFrame
            key={win.id}
            window={win}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onRestore={restoreWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            onSnapPreviewChange={handleSnapPreviewChange}
            onSnapExecute={handleSnapExecute}
          >
            <Suspense fallback={<LoadingFallback />}>
              <AppComponent windowId={win.id} payload={win.payload} />
            </Suspense>
          </WindowFrame>
        )
      })}
    </>
  )
}
