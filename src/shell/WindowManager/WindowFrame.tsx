import { type ReactNode, useCallback } from 'react'
import { Win7Icon } from '@/shared/components/Win7Icon'
import { TASKBAR_HEIGHT } from '@/shared/constants'
import type { WindowInstance } from '@/shared/types/window.types'
import { useWindowDrag, type SnapPreviewRegion } from './useWindowDrag'
import { useWindowResize } from './useWindowResize'
import styles from './WindowFrame.module.css'

interface WindowFrameProps {
  window: WindowInstance
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onRestore: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, rect: { x: number; y: number; w: number; h: number }) => void
  onSnapPreviewChange?: (region: SnapPreviewRegion) => void
  onSnapExecute?: (id: string, region: 'left' | 'right' | 'maximize') => void
  children: ReactNode
}

/* SVG window button glyphs */
function MinimizeGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect x="1" y="7" width="8" height="1.5" fill="currentColor" />
    </svg>
  )
}

function MaximizeGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function RestoreGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect x="3" y="0.5" width="6.5" height="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="0.5" y="3" width="6.5" height="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function WindowFrame({
  window: win,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onMove,
  onResize,
  onSnapPreviewChange,
  onSnapExecute,
  children,
}: WindowFrameProps) {
  const isMaximized = win.mode === 'maximized'

  const { onPointerDown: onTitleBarPointerDown } = useWindowDrag({
    windowId: win.id,
    onMove,
    onFocus,
    onMaximize,
    isMaximized,
    onRestore,
    onSnapPreviewChange,
    onSnapExecute,
  })

  const { onResizeStart } = useWindowResize({
    windowId: win.id,
    rect: win.rect,
    minW: win.minW,
    minH: win.minH,
    onResize,
    onFocus,
  })

  const handleMaxRestoreClick = useCallback(() => {
    if (isMaximized) {
      onRestore(win.id)
    } else {
      onMaximize(win.id)
    }
  }, [isMaximized, onMaximize, onRestore, win.id])

  const handleTitleBarDoubleClick = useCallback(() => {
    handleMaxRestoreClick()
  }, [handleMaxRestoreClick])

  // Compute style
  const style: React.CSSProperties = isMaximized
    ? {
        left: 0,
        top: 0,
        width: '100%',
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: win.z,
      }
    : {
        left: win.rect.x,
        top: win.rect.y,
        width: win.rect.w,
        height: win.rect.h,
        zIndex: win.z,
      }

  return (
    <div
      data-window={win.id}
      className={`${styles.window} ${win.focused ? styles.focused : ''} ${isMaximized ? styles.maximized : ''}`}
      style={style}
      onPointerDown={() => onFocus(win.id)}
    >
      {/* Title bar */}
      <div
        className={`${styles.titlebar} ${!win.focused ? styles.inactive : ''}`}
        onPointerDown={onTitleBarPointerDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        {win.icon && (
          <div className={styles.titlebarIcon}>
            <Win7Icon name={win.icon} size={16} />
          </div>
        )}
        <span className={styles.titlebarTitle}>{win.title}</span>
        <div className={styles.titlebarButtons}>
          <button
            className={styles.titlebarBtn}
            onClick={(e) => { e.stopPropagation(); onMinimize(win.id) }}
            aria-label="Minimize"
          >
            <MinimizeGlyph />
          </button>
          <button
            className={styles.titlebarBtn}
            onClick={(e) => { e.stopPropagation(); handleMaxRestoreClick() }}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <RestoreGlyph /> : <MaximizeGlyph />}
          </button>
          <button
            className={`${styles.titlebarBtn} ${styles.close}`}
            onClick={(e) => { e.stopPropagation(); onClose(win.id) }}
            aria-label="Close"
          >
            <CloseGlyph />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>

      {/* Resize handles (only in normal mode) */}
      {!isMaximized && win.resizable && (
        <>
          <div className={`${styles.resizeHandle} ${styles.resizeN}`} onPointerDown={onResizeStart('n')} />
          <div className={`${styles.resizeHandle} ${styles.resizeS}`} onPointerDown={onResizeStart('s')} />
          <div className={`${styles.resizeHandle} ${styles.resizeE}`} onPointerDown={onResizeStart('e')} />
          <div className={`${styles.resizeHandle} ${styles.resizeW}`} onPointerDown={onResizeStart('w')} />
          <div className={`${styles.resizeHandle} ${styles.resizeNE}`} onPointerDown={onResizeStart('ne')} />
          <div className={`${styles.resizeHandle} ${styles.resizeNW}`} onPointerDown={onResizeStart('nw')} />
          <div className={`${styles.resizeHandle} ${styles.resizeSE}`} onPointerDown={onResizeStart('se')} />
          <div className={`${styles.resizeHandle} ${styles.resizeSW}`} onPointerDown={onResizeStart('sw')} />
        </>
      )}
    </div>
  )
}
