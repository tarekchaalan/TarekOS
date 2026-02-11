import type { VfsJson } from '@/system/vfs/vfs.types'
import vfsJson from '@/data/vfs.json'
import { Vfs } from './vfs'

/* Load every file under src/data/content/ as raw text at build time */
const contentModules = import.meta.glob('/src/data/content/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const vfs = new Vfs(vfsJson as VfsJson, contentModules)
