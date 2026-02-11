import appsJson from '@/data/apps.json'
import type { AppRegistry } from '@/shared/types/app.types'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'
import { useStore } from '@/system/store'

const registry = appsJson as AppRegistry

export interface OpenTargetOptions {
  newWindow?: boolean
}

export type OpenTarget =
  | { kind: 'app'; appId: string; payload?: unknown }
  | { kind: 'node'; node: VfsTreeNode }
  | { kind: 'url'; url: string }

/**
 * Resolves what app should open for a given target and returns
 * the appId, title, icon, and payload needed for openWindow.
 */
export function resolveTarget(target: OpenTarget): {
  appId: string
  title: string
  icon: string
  payload?: unknown
} | null {
  if (target.kind === 'app') {
    const app = registry.apps.find((a) => a.id === target.appId)
    if (!app) return null
    return {
      appId: app.id,
      title: app.name,
      icon: app.icon,
      payload: target.payload,
    }
  }

  if (target.kind === 'url') {
    return {
      appId: 'app.browser',
      title: 'Browser',
      icon: 'icon.browser',
      payload: { url: target.url },
    }
  }

  // kind === 'node'
  const { node } = target

  if (node.type === 'shortcut' && node.target) {
    if (node.target.kind === 'app' && node.target.appId) {
      return resolveTarget({ kind: 'app', appId: node.target.appId })
    }
    // For node shortcuts, we need to resolve the target node externally
    // Return null and let the caller handle it via VFS
    return null
  }

  if (node.type === 'link' && node.url) {
    // mailto: links open in a new tab
    if (node.url.startsWith('mailto:')) {
      window.open(node.url, '_blank')
      return null
    }
    return {
      appId: 'app.browser',
      title: `Browser — ${node.name}`,
      icon: 'icon.browser',
      payload: { url: node.url },
    }
  }

  if (node.type === 'dir') {
    return {
      appId: 'app.explorer',
      title: `Explorer — ${node.name}`,
      icon: 'icon.explorer',
      payload: { nodeId: node.id },
    }
  }

  if (node.type === 'file' && node.mime) {
    // Find app by file association
    const assoc = registry.fileAssociations.find((a) => a.mime === node.mime)
    if (assoc) {
      const app = registry.apps.find((a) => a.id === assoc.defaultApp)
      if (app) {
        return {
          appId: app.id,
          title: `${app.name} — ${node.name}`,
          icon: app.icon,
          payload: { nodeId: node.id },
        }
      }
    }
  }

  return null
}

export function getAppDefinition(appId: string) {
  return registry.apps.find((a) => a.id === appId) ?? null
}

export function getAppRegistry() {
  return registry
}

/**
 * Imperatively open a URL in the built-in browser app.
 * Falls back to window.open if the browser app definition is missing.
 */
export function openUrlInBrowser(url: string) {
  const { openWindow } = useStore.getState()
  const appDef = registry.apps.find((a) => a.id === 'app.browser')
  if (!appDef) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  let title = 'Browser'
  try {
    title = `Browser — ${new URL(url).hostname}`
  } catch {
    /* keep default */
  }

  openWindow({
    appId: 'app.browser',
    title,
    icon: 'icon.browser',
    rect: {
      x: Math.max(100, (window.innerWidth - appDef.defaultWindow.w) / 2),
      y: Math.max(50, (window.innerHeight - appDef.defaultWindow.h) / 2),
      w: appDef.defaultWindow.w,
      h: appDef.defaultWindow.h,
    },
    minW: appDef.defaultWindow.minW,
    minH: appDef.defaultWindow.minH,
    payload: { url },
  })
}
