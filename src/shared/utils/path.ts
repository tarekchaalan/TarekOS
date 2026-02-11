/**
 * POSIX-like path utilities for the virtual file system.
 */

const HOME_DIR = '/Users/Tarek'

export function normalizePath(p: string): string {
  if (!p) return '/'

  const parts = p.split('/').filter(Boolean)
  const resolved: string[] = []

  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') {
      resolved.pop()
    } else {
      resolved.push(part)
    }
  }

  const result = '/' + resolved.join('/')
  return result === '/' ? '/' : result
}

export function joinPath(...segments: string[]): string {
  return normalizePath(segments.join('/'))
}

export function isAbsolutePath(p: string): boolean {
  return p.startsWith('/')
}

export function resolvePath(cwd: string, target: string): string {
  if (!target || target === '~') return HOME_DIR
  if (target.startsWith('~/')) return normalizePath(HOME_DIR + '/' + target.slice(2))
  if (isAbsolutePath(target)) return normalizePath(target)
  return normalizePath(cwd + '/' + target)
}

export function dirname(p: string): string {
  const normalized = normalizePath(p)
  if (normalized === '/') return '/'
  const lastSlash = normalized.lastIndexOf('/')
  if (lastSlash === 0) return '/'
  return normalized.slice(0, lastSlash)
}

export function basename(p: string): string {
  const normalized = normalizePath(p)
  if (normalized === '/') return '/'
  const lastSlash = normalized.lastIndexOf('/')
  return normalized.slice(lastSlash + 1)
}

export function displayPath(p: string): string {
  const normalized = normalizePath(p)
  if (normalized === HOME_DIR) return '~'
  if (normalized.startsWith(HOME_DIR + '/')) {
    return '~' + normalized.slice(HOME_DIR.length)
  }
  return normalized
}

export function parentPath(p: string): string {
  return dirname(p)
}
