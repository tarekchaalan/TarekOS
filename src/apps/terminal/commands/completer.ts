import { getCommandNames } from './index'
import { vfs } from '@/system/vfs/vfs.seed'
import { resolvePath, dirname, basename } from '@/shared/utils/path'

/**
 * Returns completion candidates for the current input.
 * If the input has no spaces, completes command names.
 * If the input has spaces, completes VFS paths for the last argument.
 */
export function getCompletions(
  input: string,
  cwd: string,
): string[] {
  const parts = input.split(' ')

  // Completing command name
  if (parts.length <= 1) {
    const prefix = parts[0] ?? ''
    return getCommandNames().filter((name) => name.startsWith(prefix))
  }

  // Completing a path argument
  const partial = parts[parts.length - 1]
  const dir = partial.includes('/') ? dirname(partial) : ''
  const prefix = partial.includes('/') ? basename(partial) : partial

  const resolvedDir = dir
    ? resolvePath(cwd, dir)
    : cwd

  const children = vfs.list(resolvedDir)
  const matches = children
    .filter((node) => node.name.toLowerCase().startsWith(prefix.toLowerCase()))
    .map((node) => {
      const completedName = node.type === 'dir' ? node.name + '/' : node.name
      return dir ? `${dir}/${completedName}` : completedName
    })

  return matches
}
