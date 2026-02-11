import type { VfsJson, VfsNode, VfsTreeNode } from '@/system/vfs/vfs.types'

/* ------------------------------------------------------------------ */
/*  Content-ref prefix used by Vite glob import paths                 */
/* ------------------------------------------------------------------ */

const CONTENT_PREFIX = '/src/data/'

/**
 * Normalise a Vite glob key (e.g. "/src/data/content/about.txt")
 * into the contentRef stored in vfs.json (e.g. "content/about.txt").
 */
function normKey(key: string): string {
  return key.startsWith(CONTENT_PREFIX) ? key.slice(CONTENT_PREFIX.length) : key
}

/* ------------------------------------------------------------------ */
/*  VFS engine                                                        */
/* ------------------------------------------------------------------ */

export class Vfs {
  private nodeMap = new Map<string, VfsTreeNode>()
  private pathMap = new Map<string, VfsTreeNode>()
  private contentMap = new Map<string, string>()
  private root!: VfsTreeNode

  constructor(json: VfsJson, rawContentMap: Record<string, string>) {
    // Build normalised content lookup
    for (const [key, value] of Object.entries(rawContentMap)) {
      this.contentMap.set(normKey(key), value)
    }

    // Index raw nodes by id for fast child resolution
    const rawById = new Map<string, VfsNode>()
    for (const node of json.nodes) {
      rawById.set(node.id, node)
    }

    // Build tree starting from root
    const rawRoot = rawById.get(json.rootId)
    if (!rawRoot) throw new Error(`VFS root node "${json.rootId}" not found`)

    this.root = this.buildTree(rawRoot, null, rawById)

    // Build path index
    this.indexPaths(this.root, '')
  }

  /* ----- tree construction ---------------------------------------- */

  private buildTree(
    raw: VfsNode,
    parent: VfsTreeNode | null,
    rawById: Map<string, VfsNode>,
  ): VfsTreeNode {
    const treeNode: VfsTreeNode = {
      id: raw.id,
      type: raw.type,
      name: raw.name,
      parent,
      childNodes: [],
      ...(raw.pathHint !== undefined && { pathHint: raw.pathHint }),
      ...(raw.icon !== undefined && { icon: raw.icon }),
      ...(raw.desktop !== undefined && { desktop: raw.desktop }),
      ...(raw.meta !== undefined && { meta: raw.meta }),
    }

    // Type-specific fields
    if (raw.type === 'file') {
      treeNode.mime = raw.mime
      treeNode.contentRef = raw.contentRef
      treeNode.openWith = raw.openWith
    } else if (raw.type === 'link') {
      treeNode.url = raw.url
      treeNode.openWith = raw.openWith
    } else if (raw.type === 'shortcut') {
      treeNode.target = raw.target
    } else if (raw.type === 'dir') {
      treeNode.children = raw.children
    }

    // Register in nodeMap
    this.nodeMap.set(treeNode.id, treeNode)

    // Recurse into children for directories
    if (raw.type === 'dir' && raw.children) {
      for (const childId of raw.children) {
        const childRaw = rawById.get(childId)
        if (!childRaw) {
          console.warn(`VFS: child node "${childId}" referenced but not found`)
          continue
        }
        const childTree = this.buildTree(childRaw, treeNode, rawById)
        treeNode.childNodes.push(childTree)
      }
    }

    return treeNode
  }

  /* ----- path index ----------------------------------------------- */

  private indexPaths(node: VfsTreeNode, parentPath: string): void {
    // Root is just "/"
    const path =
      node.parent === null ? '/' : `${parentPath === '/' ? '' : parentPath}/${node.name}`

    this.pathMap.set(path, node)

    for (const child of node.childNodes) {
      this.indexPaths(child, path)
    }
  }

  /* ----- public API ----------------------------------------------- */

  /** Look up a node by its unique id. */
  getNode(id: string): VfsTreeNode | null {
    return this.nodeMap.get(id) ?? null
  }

  /** Resolve an absolute path (e.g. "/Desktop/About.txt") to a node. */
  resolve(path: string): VfsTreeNode | null {
    if (!path.startsWith('/')) return null

    // Fast path: direct lookup
    const direct = this.pathMap.get(path)
    if (direct) return direct

    // Walk the tree segment by segment
    const segments = path.split('/').filter(Boolean)
    let current: VfsTreeNode = this.root

    for (const seg of segments) {
      const child = current.childNodes.find(
        (c) => c.name === seg || c.name.toLowerCase() === seg.toLowerCase(),
      )
      if (!child) return null
      current = child
    }

    return current
  }

  /** List children of the directory at the given path. */
  list(path: string): VfsTreeNode[] {
    const node = this.resolve(path)
    if (!node || node.type !== 'dir') return []
    return node.childNodes
  }

  /** Read the text content of a file node at the given path. */
  readContent(path: string): string | null {
    const node = this.resolve(path)
    if (!node || node.type !== 'file' || !node.contentRef) return null
    return this.contentMap.get(node.contentRef) ?? null
  }

  /** Read the text content of a file node by its id. */
  readContentById(id: string): string | null {
    const node = this.nodeMap.get(id)
    if (!node || node.type !== 'file' || !node.contentRef) return null
    return this.contentMap.get(node.contentRef) ?? null
  }

  /** Compute the full absolute path from root for a given node. */
  getPath(node: VfsTreeNode): string {
    if (node.parent === null) return '/'
    const parts: string[] = []
    let current: VfsTreeNode | null = node
    while (current && current.parent !== null) {
      parts.unshift(current.name)
      current = current.parent
    }
    return '/' + parts.join('/')
  }

  /**
   * Search nodes by name (case-insensitive substring match).
   * Optional filters: starting path, node type, max results.
   */
  find(
    query: string,
    opts?: { path?: string; type?: string; max?: number },
  ): VfsTreeNode[] {
    const lowerQuery = query.toLowerCase()
    const maxResults = opts?.max ?? 50
    const filterType = opts?.type
    const results: VfsTreeNode[] = []

    const startNode = opts?.path ? this.resolve(opts.path) : this.root
    if (!startNode) return results

    const walk = (node: VfsTreeNode): void => {
      if (results.length >= maxResults) return

      const nameMatch = node.name.toLowerCase().includes(lowerQuery)
      const typeMatch = !filterType || node.type === filterType

      if (nameMatch && typeMatch) {
        results.push(node)
      }

      for (const child of node.childNodes) {
        if (results.length >= maxResults) return
        walk(child)
      }
    }

    walk(startNode)
    return results
  }

  /** Return all nodes in /Desktop that have desktop coordinates. */
  getDesktopItems(): VfsTreeNode[] {
    const desktop = this.resolve('/Desktop')
    if (!desktop) return []
    return desktop.childNodes.filter((n) => n.desktop !== undefined)
  }

  /** Return the root node. */
  getRoot(): VfsTreeNode {
    return this.root
  }
}
