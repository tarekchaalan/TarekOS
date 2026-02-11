import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/system/store'
import { vfs } from '@/system/vfs/vfs.seed'
import { resolveTarget, getAppDefinition } from '@/system/openTarget'
import { Win7Icon } from '@/shared/components/Win7Icon'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'

/* ------------------------------------------------------------------ */
/*  Icon name resolution                                               */
/* ------------------------------------------------------------------ */

function getNodeIconName(node: VfsTreeNode): string {
  if (node.icon) return node.icon
  if (node.type === 'dir') return 'icon.folder'
  if (node.type === 'link') return 'icon.link'
  if (node.type === 'shortcut') return 'icon.shortcut'
  if (node.mime) {
    if (node.mime === 'application/pdf') return 'icon.pdf'
    if (node.mime.startsWith('image/')) return 'icon.image'
    if (node.mime === 'text/markdown') return 'icon.markdown'
    if (node.mime === 'application/json') return 'icon.json'
  }
  return 'icon.file'
}

/* ------------------------------------------------------------------ */
/*  Navigation Pane (Sidebar)                                          */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
}

const sidebarLinks = [
  { label: 'Desktop', path: '/Desktop', icon: 'icon.folder' },
  { label: 'Documents', path: '/Users/Tarek/Documents', icon: 'icon.documents' },
  { label: 'Projects', path: '/Users/Tarek/Projects', icon: 'icon.folder' },
  { label: 'Contact', path: '/Users/Tarek/Contact', icon: 'icon.folder' },
  { label: 'Games', path: '/Users/Tarek/Games', icon: 'icon.games' },
]

function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  return (
    <div className="flex w-[180px] shrink-0 flex-col border-r border-[#d0d0d0]"
      style={{ background: 'linear-gradient(180deg, #eef3fa 0%, #dce6f4 100%)' }}
    >
      {/* Favorites header */}
      <div className="px-3 pb-1 pt-3 text-[11px] font-semibold text-[#4e6a8a]">
        Favorites
      </div>
      <nav className="flex flex-col px-1">
        {sidebarLinks.map((link) => {
          const active = currentPath === link.path
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`flex items-center gap-2 rounded px-2 py-[3px] text-left text-[12px] transition-colors ${
                active
                  ? 'bg-[#cce0f8] text-[#1a3a5c]'
                  : 'text-[#1a1a1a] hover:bg-[#dce8f6]'
              }`}
            >
              <Win7Icon name={link.icon} size={16} />
              <span className="truncate">{link.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Libraries header */}
      <div className="mt-3 px-3 pb-1 text-[11px] font-semibold text-[#4e6a8a]">
        Computer
      </div>
      <nav className="flex flex-col px-1">
        <button
          onClick={() => onNavigate('/')}
          className={`flex items-center gap-2 rounded px-2 py-[3px] text-left text-[12px] transition-colors ${
            currentPath === '/'
              ? 'bg-[#cce0f8] text-[#1a3a5c]'
              : 'text-[#1a1a1a] hover:bg-[#dce8f6]'
          }`}
        >
          <Win7Icon name="icon.mycomputer" size={16} />
          <span className="truncate">Computer</span>
        </button>
        <button
          onClick={() => onNavigate('/Users/Tarek')}
          className={`flex items-center gap-2 rounded px-2 py-[3px] text-left text-[12px] transition-colors ${
            currentPath === '/Users/Tarek'
              ? 'bg-[#cce0f8] text-[#1a3a5c]'
              : 'text-[#1a1a1a] hover:bg-[#dce8f6]'
          }`}
        >
          <Win7Icon name="icon.folder" size={16} />
          <span className="truncate">Tarek</span>
        </button>
      </nav>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Address Bar                                                        */
/* ------------------------------------------------------------------ */

interface AddressBarProps {
  currentPath: string
  onNavigate: (path: string) => void
  children?: React.ReactNode
}

function AddressBar({ currentPath, onNavigate, children }: AddressBarProps) {
  const segments = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean)
    const items: Array<{ label: string; path: string }> = []
    let accumulated = ''
    for (const part of parts) {
      accumulated += '/' + part
      items.push({ label: part, path: accumulated })
    }
    return items
  }, [currentPath])

  return (
    <div
      className="flex items-center gap-0.5 border-b border-[#c8c8c8] px-2 py-1.5"
      style={{ background: 'linear-gradient(180deg, #f8f8f8 0%, #eaeaea 100%)' }}
    >
      {/* Back / Forward / Up buttons */}
      <button
        className="mr-1 flex h-[22px] w-[22px] items-center justify-center rounded-sm text-[#555] hover:bg-[#ddd]"
        onClick={() => {
          const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
          onNavigate(parent)
        }}
        title="Up"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 9V3M3 5.5L6 2.5L9 5.5" />
        </svg>
      </button>

      {/* Address breadcrumb */}
      <div className="flex flex-1 items-center gap-0.5 overflow-hidden rounded border border-[#b8b8b8] bg-white px-2 py-[2px]">
        <button
          onClick={() => onNavigate('/')}
          className="shrink-0 rounded px-1 py-0.5 text-[12px] text-[#0066cc] hover:bg-[#e8f0fe] hover:underline"
        >
          <Win7Icon name="icon.mycomputer" size={14} />
        </button>

        {segments.map((seg, i) => (
          <div key={seg.path} className="flex items-center gap-0.5">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round">
              <path d="M2.5 1.5L5.5 4L2.5 6.5" />
            </svg>
            <button
              onClick={() => onNavigate(seg.path)}
              className={`rounded px-1 py-0.5 text-[12px] transition-colors hover:bg-[#e8f0fe] ${
                i === segments.length - 1
                  ? 'font-semibold text-[#1a1a1a]'
                  : 'text-[#0066cc] hover:underline'
              }`}
            >
              {seg.label}
            </button>
          </div>
        ))}
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  View types                                                         */
/* ------------------------------------------------------------------ */

type ViewMode = 'icons' | 'details'

/* ------------------------------------------------------------------ */
/*  File content area                                                  */
/* ------------------------------------------------------------------ */

interface FileViewProps {
  items: VfsTreeNode[]
  onOpen: (node: VfsTreeNode) => void
  viewMode: ViewMode
}

function getNodeType(node: VfsTreeNode): string {
  if (node.type === 'dir') return 'File folder'
  if (node.type === 'link') return 'Link'
  if (node.type === 'shortcut') return 'Shortcut'
  if (node.mime === 'application/pdf') return 'PDF Document'
  if (node.mime === 'text/markdown') return 'Markdown File'
  if (node.mime === 'application/json') return 'JSON File'
  if (node.mime === 'text/plain') return 'Text Document'
  if (node.mime?.startsWith('image/')) return 'Image'
  return 'File'
}

type SortKey = 'name' | 'type'
type SortDir = 'asc' | 'desc'

function FileView({ items, onOpen, viewMode }: FileViewProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Directories first
      if (a.type === 'dir' && b.type !== 'dir') return -1
      if (a.type !== 'dir' && b.type === 'dir') return 1
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else {
        cmp = getNodeType(a).localeCompare(getNodeType(b))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [items, sortKey, sortDir])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white text-[#888]">
        <p className="text-sm">This folder is empty</p>
      </div>
    )
  }

  if (viewMode === 'details') {
    const arrow = sortDir === 'asc' ? ' \u25B4' : ' \u25BE'
    return (
      <div className="flex-1 overflow-auto bg-white" onClick={() => setSelected(null)}>
        {/* Column headers */}
        <div className="sticky top-0 z-10 flex border-b border-[#d0d0d0]" style={{ background: 'linear-gradient(180deg, #fff 0%, #eee 100%)' }}>
          <button
            className="flex-1 px-3 py-[3px] text-left text-[11px] font-semibold text-[#444] hover:bg-[#e0e8f0]"
            onClick={(e) => { e.stopPropagation(); handleSort('name') }}
          >
            Name{sortKey === 'name' ? arrow : ''}
          </button>
          <button
            className="w-[140px] shrink-0 border-l border-[#d0d0d0] px-3 py-[3px] text-left text-[11px] font-semibold text-[#444] hover:bg-[#e0e8f0]"
            onClick={(e) => { e.stopPropagation(); handleSort('type') }}
          >
            Type{sortKey === 'type' ? arrow : ''}
          </button>
        </div>
        {/* Rows */}
        {sortedItems.map((node) => {
          const iconName = getNodeIconName(node)
          const isSelected = selected === node.id
          return (
            <div
              key={node.id}
              className={`flex cursor-default items-center border-b border-[#f0f0f0] transition-colors ${
                isSelected ? 'bg-[#cce8ff]' : 'hover:bg-[#e5f3ff]'
              }`}
              onClick={(e) => { e.stopPropagation(); setSelected(node.id) }}
              onDoubleClick={() => onOpen(node)}
            >
              <div className="flex flex-1 items-center gap-2 px-3 py-[2px]">
                <Win7Icon name={iconName} size={16} />
                <span className="truncate text-[12px] text-[#1a1a1a]">{node.name}</span>
              </div>
              <div className="w-[140px] shrink-0 border-l border-[#f0f0f0] px-3 py-[2px] text-[11px] text-[#666]">
                {getNodeType(node)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Icon grid view
  return (
    <div
      className="flex-1 overflow-auto bg-white p-3"
      onClick={() => setSelected(null)}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-1">
        {sortedItems.map((node) => {
          const iconName = getNodeIconName(node)
          const isSelected = selected === node.id
          return (
            <button
              key={node.id}
              onClick={(e) => { e.stopPropagation(); setSelected(node.id) }}
              onDoubleClick={() => onOpen(node)}
              className={`group flex flex-col items-center gap-1 rounded p-2 text-center transition-colors ${
                isSelected
                  ? 'bg-[#cce8ff] outline outline-1 outline-[#99d1ff]'
                  : 'hover:bg-[#e5f3ff]'
              }`}
            >
              <Win7Icon name={iconName} size={40} />
              <span className="w-full text-[11px] leading-tight text-[#1a1a1a]" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}>
                {node.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status Bar                                                         */
/* ------------------------------------------------------------------ */

function StatusBar({ itemCount }: { itemCount: number }) {
  return (
    <div
      className="flex items-center border-t border-[#c8c8c8] px-3 py-[2px]"
      style={{ background: 'linear-gradient(180deg, #eee 0%, #ddd 100%)' }}
    >
      <span className="text-[11px] text-[#444]">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Explorer App                                                       */
/* ------------------------------------------------------------------ */

export default function ExplorerApp({
  windowId: _windowId,
  payload,
}: {
  windowId: string
  payload?: unknown
}) {
  const openWindow = useStore((s) => s.openWindow)

  // Resolve initial path from payload
  const initialPath = useMemo(() => {
    const p = payload as { nodeId?: string; path?: string } | undefined
    if (p?.nodeId) {
      const node = vfs.getNode(p.nodeId)
      if (node) {
        if (node.type === 'dir') {
          return vfs.getPath(node)
        }
        if (node.parent) {
          return vfs.getPath(node.parent)
        }
      }
    }
    if (p?.path) return p.path
    return '/Users/Tarek'
  }, [payload])

  const [currentPath, setCurrentPath] = useState(initialPath)

  const children = useMemo(() => vfs.list(currentPath), [currentPath])

  const handleNavigate = useCallback((path: string) => {
    const node = vfs.resolve(path)
    if (node && node.type === 'dir') {
      setCurrentPath(path)
    }
  }, [])

  const handleOpen = useCallback(
    (node: VfsTreeNode) => {
      if (node.type === 'dir') {
        setCurrentPath(vfs.getPath(node))
        return
      }

      // For shortcuts pointing to nodes, resolve the target
      if (node.type === 'shortcut' && node.target?.kind === 'node' && node.target.nodeId) {
        const targetNode = vfs.getNode(node.target.nodeId)
        if (targetNode) {
          if (targetNode.type === 'dir') {
            setCurrentPath(vfs.getPath(targetNode))
            return
          }
          const resolved = resolveTarget({ kind: 'node', node: targetNode })
          if (resolved) {
            const appDef = getAppDef(resolved.appId)
            openWindow({
              appId: resolved.appId,
              title: resolved.title,
              icon: resolved.icon,
              rect: { x: 120, y: 80, w: appDef?.w ?? 800, h: appDef?.h ?? 600 },
              minW: appDef?.minW ?? 400,
              minH: appDef?.minH ?? 300,
              payload: resolved.payload,
            })
          }
          return
        }
      }

      // For everything else, use resolveTarget
      const resolved = resolveTarget({ kind: 'node', node })
      if (resolved) {
        const appDef = getAppDef(resolved.appId)
        openWindow({
          appId: resolved.appId,
          title: resolved.title,
          icon: resolved.icon,
          rect: { x: 120, y: 80, w: appDef?.w ?? 800, h: appDef?.h ?? 600 },
          minW: appDef?.minW ?? 400,
          minH: appDef?.minH ?? 300,
          payload: resolved.payload,
        })
      }
    },
    [openWindow],
  )

  const [viewMode, setViewMode] = useState<ViewMode>('icons')

  return (
    <div className="flex h-full flex-col bg-[#f0f0f0]">
      <AddressBar currentPath={currentPath} onNavigate={handleNavigate}>
        {/* View toggle buttons */}
        <div className="ml-1 flex items-center gap-0.5 rounded border border-[#b8b8b8] bg-white px-0.5 py-[1px]">
          <button
            onClick={() => setViewMode('icons')}
            className={`rounded-sm p-[3px] transition-colors ${viewMode === 'icons' ? 'bg-[#cce0f8]' : 'hover:bg-[#e8f0fe]'}`}
            title="Icons"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="0.5" fill={viewMode === 'icons' ? '#1a3a5c' : '#666'} />
              <rect x="8" y="1" width="5" height="5" rx="0.5" fill={viewMode === 'icons' ? '#1a3a5c' : '#666'} />
              <rect x="1" y="8" width="5" height="5" rx="0.5" fill={viewMode === 'icons' ? '#1a3a5c' : '#666'} />
              <rect x="8" y="8" width="5" height="5" rx="0.5" fill={viewMode === 'icons' ? '#1a3a5c' : '#666'} />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('details')}
            className={`rounded-sm p-[3px] transition-colors ${viewMode === 'details' ? 'bg-[#cce0f8]' : 'hover:bg-[#e8f0fe]'}`}
            title="Details"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1.5" width="3" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
              <rect x="5.5" y="1.5" width="7.5" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
              <rect x="1" y="6" width="3" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
              <rect x="5.5" y="6" width="7.5" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
              <rect x="1" y="10.5" width="3" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
              <rect x="5.5" y="10.5" width="7.5" height="2" rx="0.3" fill={viewMode === 'details' ? '#1a3a5c' : '#666'} />
            </svg>
          </button>
        </div>
      </AddressBar>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
        <FileView items={children} onOpen={handleOpen} viewMode={viewMode} />
      </div>
      <StatusBar itemCount={children.length} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAppDef(appId: string): { w: number; h: number; minW: number; minH: number } | null {
  const def = getAppDefinition(appId)
  if (!def) return null
  return {
    w: def.defaultWindow.w,
    h: def.defaultWindow.h,
    minW: def.defaultWindow.minW,
    minH: def.defaultWindow.minH,
  }
}
