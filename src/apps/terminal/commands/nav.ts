import type { CommandDef, CommandResult } from './index'
import type { VfsTreeNode } from '@/system/vfs/vfs.types'
import { getAllCommands } from './index'
import { resolvePath, displayPath } from '@/shared/utils/path'
import { resolveTarget, getAppDefinition } from '@/system/openTarget'

/* ------------------------------------------------------------------ */
/*  Navigation & file commands                                         */
/* ------------------------------------------------------------------ */

export const navCommands: CommandDef[] = [
  /* ------------------------------------------------------------------ */
  /*  help                                                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'help',
    description: 'List all available commands or show help for a specific command.',
    usage: 'help [command]',
    handler(args, _flags, ctx) {
      const all = getAllCommands()

      // If a specific command is requested, show its details
      if (args.length > 0) {
        const target = all.find((c) => c.name === args[0])
        if (!target) {
          ctx.printError(`help: unknown command '${args[0]}'`)
          return
        }
        ctx.print(`  ${target.name} — ${target.description}`)
        if (target.usage) {
          ctx.print(`  Usage: ${target.usage}`)
        }
        return
      }

      // Group commands by category based on module
      const categories: Record<string, typeof all> = {
        'Navigation & Files': [],
        'System & Info': [],
        'Portfolio': [],
        'Fun & Misc': [],
      }

      // Simple heuristic: assign known commands to categories
      const navCmds = new Set(['help', 'clear', 'pwd', 'ls', 'cd', 'cat', 'open', 'find', 'tree', 'mkdir'])
      const osCmds = new Set(['whoami', 'date', 'uptime', 'hostname', 'uname', 'neofetch', 'theme', 'echo'])
      const portfolioCmds = new Set(['about', 'skills', 'experience', 'projects', 'contact', 'resume', 'education'])

      for (const cmd of all) {
        if (navCmds.has(cmd.name)) {
          categories['Navigation & Files'].push(cmd)
        } else if (osCmds.has(cmd.name)) {
          categories['System & Info'].push(cmd)
        } else if (portfolioCmds.has(cmd.name)) {
          categories['Portfolio'].push(cmd)
        } else {
          categories['Fun & Misc'].push(cmd)
        }
      }

      ctx.print('Available commands:')
      ctx.print('')

      for (const [category, cmds] of Object.entries(categories)) {
        if (cmds.length === 0) continue
        ctx.print(`  ${category}:`)
        for (const cmd of cmds) {
          const padded = cmd.name.padEnd(14)
          ctx.print(`    ${padded} ${cmd.description}`)
        }
        ctx.print('')
      }

      ctx.print("Type 'help <command>' for detailed usage.")
    },
  },

  /* ------------------------------------------------------------------ */
  /*  clear                                                              */
  /* ------------------------------------------------------------------ */
  {
    name: 'clear',
    description: 'Clear the terminal screen.',
    usage: 'clear',
    handler(_args, _flags, ctx) {
      ctx.clear()
    },
  },

  /* ------------------------------------------------------------------ */
  /*  pwd                                                                */
  /* ------------------------------------------------------------------ */
  {
    name: 'pwd',
    description: 'Print the current working directory.',
    usage: 'pwd',
    handler(_args, _flags, ctx) {
      ctx.print(ctx.cwd)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  ls                                                                 */
  /* ------------------------------------------------------------------ */
  {
    name: 'ls',
    description: 'List directory contents.',
    usage: 'ls [-a] [-l] [path]',
    handler(args, flags, ctx) {
      const targetPath = args.length > 0 ? resolvePath(ctx.cwd, args[0]) : ctx.cwd
      const node = ctx.vfs.resolve(targetPath)

      if (!node) {
        ctx.printError(`ls: cannot access '${args[0] ?? targetPath}': No such file or directory`)
        return
      }

      if (node.type !== 'dir') {
        // If it's a file, just print its name
        if (flags.l) {
          ctx.print(`${node.type.padEnd(10)} ${node.name}`)
        } else {
          ctx.print(node.name)
        }
        return
      }

      const children = ctx.vfs.list(targetPath)
      const showAll = Boolean(flags.a)
      const longFormat = Boolean(flags.l)

      const filtered = showAll
        ? children
        : children.filter((c) => !c.name.startsWith('.'))

      if (filtered.length === 0) {
        return // empty directory, print nothing
      }

      if (longFormat) {
        for (const child of filtered) {
          const typeLabel = child.type.padEnd(10)
          ctx.print(`  ${typeLabel} ${child.name}`)
        }
      } else {
        const names = filtered.map((c) =>
          c.type === 'dir' ? `${c.name}/` : c.name,
        )
        ctx.print(names.join('  '))
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  cd                                                                 */
  /* ------------------------------------------------------------------ */
  {
    name: 'cd',
    description: 'Change the current working directory.',
    usage: 'cd [path]',
    handler(args, _flags, ctx): CommandResult | void {
      const target = args[0] ?? '~'
      const resolved = resolvePath(ctx.cwd, target)
      const node = ctx.vfs.resolve(resolved)

      if (!node) {
        ctx.printError(`cd: no such file or directory: ${target}`)
        return
      }

      if (node.type !== 'dir') {
        ctx.printError(`cd: not a directory: ${target}`)
        return
      }

      return { newCwd: resolved }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  cat                                                                */
  /* ------------------------------------------------------------------ */
  {
    name: 'cat',
    description: 'Display the contents of a file.',
    usage: 'cat <file>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('cat: missing file operand')
        return
      }

      const resolved = resolvePath(ctx.cwd, args[0])
      const node = ctx.vfs.resolve(resolved)

      if (!node) {
        ctx.printError(`cat: ${args[0]}: No such file or directory`)
        return
      }

      if (node.type === 'dir') {
        ctx.printError(`cat: ${args[0]}: Is a directory`)
        return
      }

      const content = ctx.vfs.readContent(resolved)
      if (content === null) {
        ctx.printError(`cat: ${args[0]}: Unable to read file`)
        return
      }

      ctx.print(content)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  open                                                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'open',
    description: 'Open a file, folder, or application.',
    usage: 'open <path|appname>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('open: missing operand')
        return
      }

      // First, try to resolve as a VFS path
      const resolved = resolvePath(ctx.cwd, args[0])
      const targetNode = ctx.vfs.resolve(resolved)

      if (targetNode) {
        const result = resolveTarget({ kind: 'node', node: targetNode })
        if (!result) {
          ctx.printError('open: cannot open — no app registered for this type')
          return
        }

        const appDef = getAppDefinition(result.appId)
        if (!appDef) {
          ctx.printError(`open: app '${result.appId}' not found`)
          return
        }

        ctx.store.openWindow({
          appId: result.appId,
          title: result.title,
          icon: result.icon,
          rect: { x: 200, y: 100, w: appDef.defaultWindow.w, h: appDef.defaultWindow.h },
          minW: appDef.defaultWindow.minW,
          minH: appDef.defaultWindow.minH,
          payload: result.payload,
        })

        ctx.print(`Opened ${result.title}`)
        return
      }

      // Not a VFS path — try to open as an app by name
      const result = resolveTarget({ kind: 'app', appId: `app.${args[0]}` })
      if (!result) {
        ctx.printError(`open: '${args[0]}' — no such file or application`)
        return
      }

      const appDef = getAppDefinition(result.appId)
      if (!appDef) {
        ctx.printError(`open: app '${result.appId}' not found`)
        return
      }

      ctx.store.openWindow({
        appId: result.appId,
        title: result.title,
        icon: result.icon,
        rect: { x: 200, y: 100, w: appDef.defaultWindow.w, h: appDef.defaultWindow.h },
        minW: appDef.defaultWindow.minW,
        minH: appDef.defaultWindow.minH,
        payload: result.payload,
      })

      ctx.print(`Opened ${result.title}`)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  find                                                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'find',
    description: 'Search for files and directories by name.',
    usage: 'find <query> [path]',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('find: missing search query')
        return
      }

      const query = args[0]
      const startPath = args.length > 1 ? resolvePath(ctx.cwd, args[1]) : ctx.cwd
      const results = ctx.vfs.find(query, { path: startPath })

      if (results.length === 0) {
        ctx.print(`No results found for '${query}'`)
        return
      }

      for (const node of results) {
        ctx.print(displayPath(ctx.vfs.getPath(node)))
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  tree                                                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'tree',
    description: 'Display a directory tree.',
    usage: 'tree [path] [--depth=N]',
    handler(args, flags, ctx) {
      const targetPath = args.length > 0 ? resolvePath(ctx.cwd, args[0]) : ctx.cwd
      const node = ctx.vfs.resolve(targetPath)

      if (!node) {
        ctx.printError(`tree: '${args[0] ?? targetPath}': No such file or directory`)
        return
      }

      if (node.type !== 'dir') {
        ctx.print(node.name)
        return
      }

      const maxDepth = typeof flags.depth === 'string' ? parseInt(flags.depth, 10) : Infinity

      ctx.print(displayPath(targetPath))

      function walk(
        children: VfsTreeNode[],
        prefix: string,
        depth: number,
      ): void {
        if (depth > maxDepth) return

        for (let i = 0; i < children.length; i++) {
          const child = children[i]
          const isLast = i === children.length - 1
          const connector = isLast ? '└── ' : '├── '
          const label = child.type === 'dir' ? `${child.name}/` : child.name

          ctx.print(`${prefix}${connector}${label}`)

          if (child.type === 'dir' && child.childNodes.length > 0) {
            const nextPrefix = prefix + (isLast ? '    ' : '│   ')
            walk(child.childNodes, nextPrefix, depth + 1)
          }
        }
      }

      walk(node.childNodes, '', 1)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  mkdir                                                              */
  /* ------------------------------------------------------------------ */
  {
    name: 'mkdir',
    description: 'Create a new directory (simulated).',
    usage: 'mkdir <dirname>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('mkdir: missing operand')
        return
      }

      // VFS is read-only, but we pretend it worked
      ctx.print(`Directory created: ${resolvePath(ctx.cwd, args[0])}`)
    },
  },
]
