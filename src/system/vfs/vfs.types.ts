export type VfsNodeType = 'dir' | 'file' | 'link' | 'shortcut'

export interface VfsDesktopPosition {
  x: number
  y: number
}

export interface VfsMeta {
  tags?: string[]
  featured?: boolean
  slug?: string
  [key: string]: unknown
}

export interface VfsShortcutTarget {
  kind: 'app' | 'node'
  appId?: string
  nodeId?: string
}

export interface VfsNodeBase {
  id: string
  type: VfsNodeType
  name: string
  pathHint?: string
  icon?: string
  desktop?: VfsDesktopPosition
  meta?: VfsMeta
}

export interface VfsDir extends VfsNodeBase {
  type: 'dir'
  children: string[]
}

export interface VfsFile extends VfsNodeBase {
  type: 'file'
  mime: string
  contentRef?: string
  openWith?: string[]
}

export interface VfsLink extends VfsNodeBase {
  type: 'link'
  url: string
  openWith?: string[]
}

export interface VfsShortcut extends VfsNodeBase {
  type: 'shortcut'
  target: VfsShortcutTarget
}

export type VfsNode = VfsDir | VfsFile | VfsLink | VfsShortcut

export interface VfsTreeNode extends VfsNodeBase {
  type: VfsNodeType
  parent: VfsTreeNode | null
  childNodes: VfsTreeNode[]
  // File-specific
  mime?: string
  contentRef?: string
  openWith?: string[]
  // Link-specific
  url?: string
  // Shortcut-specific
  target?: VfsShortcutTarget
  // Dir-specific
  children?: string[]
}

export interface VfsJson {
  version: string
  rootId: string
  nodes: VfsNode[]
}
