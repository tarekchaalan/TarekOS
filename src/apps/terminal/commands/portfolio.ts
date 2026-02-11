import type { CommandDef } from './index'

export const portfolioCommands: CommandDef[] = [
  /* ------------------------------------------------------------------ */
  /*  whoami – print identity                                            */
  /* ------------------------------------------------------------------ */
  {
    name: 'whoami',
    description: 'Print current user identity',
    handler(_args, _flags, ctx) {
      ctx.print('Tarek Chaalan — Software Engineer')
    },
  },

  /* ------------------------------------------------------------------ */
  /*  about – display about info                                         */
  /* ------------------------------------------------------------------ */
  {
    name: 'about',
    description: 'Display information about Tarek',
    usage: 'about [--open]',
    handler(_args, flags, ctx) {
      if (flags.open) {
        const node = ctx.vfs.resolve('/Desktop/About.txt')
        if (!node) {
          ctx.printError('Could not find /Desktop/About.txt')
          return
        }
        ctx.store.openWindow({
          appId: 'app.notepad',
          title: `Notepad — About.txt`,
          icon: 'icon.notepad',
          rect: { x: 200, y: 100, w: 700, h: 500 },
          minW: 400,
          minH: 300,
          payload: { nodeId: node.id },
        })
        ctx.print('Opened About.txt in Notepad')
        return
      }

      const content = ctx.vfs.readContent('/Desktop/About.txt')
      if (!content) {
        ctx.printError('Could not read /Desktop/About.txt')
        return
      }
      ctx.print(content)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  skills – display skills                                            */
  /* ------------------------------------------------------------------ */
  {
    name: 'skills',
    description: 'Display technical skills',
    usage: 'skills [--grouped]',
    handler(_args, flags, ctx) {
      const content = ctx.vfs.readContent('/Users/Tarek/Documents/Skills.md')
      if (!content) {
        ctx.printError('Could not read /Users/Tarek/Documents/Skills.md')
        return
      }

      if (flags.grouped) {
        ctx.print(content)
      } else {
        ctx.print(content)
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  experience – display work experience                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'experience',
    description: 'Display work experience',
    handler(_args, _flags, ctx) {
      const content = ctx.vfs.readContent('/Users/Tarek/Documents/Experience.md')
      if (!content) {
        ctx.printError('Could not read /Users/Tarek/Documents/Experience.md')
        return
      }
      ctx.print(content)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  projects – list portfolio projects                                 */
  /* ------------------------------------------------------------------ */
  {
    name: 'projects',
    description: 'List portfolio projects',
    usage: 'projects [--top]',
    handler(_args, flags, ctx) {
      const children = ctx.vfs.list('/Users/Tarek/Projects')
      if (children.length === 0) {
        ctx.printError('No projects found in /Users/Tarek/Projects/')
        return
      }

      const filtered = flags.top
        ? children.filter((node) => node.meta?.featured === true)
        : children

      if (filtered.length === 0) {
        ctx.print('  No featured projects found.')
        return
      }

      for (const node of filtered) {
        const tags = node.meta?.tags
          ? (node.meta.tags as string[]).join(', ')
          : ''
        const tagStr = tags ? `  [${tags}]` : ''
        ctx.print(`  ${node.name}${tagStr}`)
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  project – open a specific project                                  */
  /* ------------------------------------------------------------------ */
  {
    name: 'project',
    description: 'Open a project folder by slug',
    usage: 'project <slug>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('Usage: project <slug>')
        return
      }

      const slug = args[0]
      const children = ctx.vfs.list('/Users/Tarek/Projects')
      const projectNode = children.find((node) => node.meta?.slug === slug)

      if (!projectNode) {
        ctx.printError(`Project not found: ${slug}`)
        ctx.print('  Use "projects" to see available projects.')
        return
      }

      ctx.store.openWindow({
        appId: 'app.explorer',
        title: `Explorer — ${projectNode.name}`,
        icon: 'icon.explorer',
        rect: { x: 200, y: 100, w: 900, h: 600 },
        minW: 520,
        minH: 360,
        payload: { nodeId: projectNode.id },
      })

      ctx.print(`Opened project: ${projectNode.name}`)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  resume – view resume                                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'resume',
    description: 'View or open resume',
    usage: 'resume [--open] [--text]',
    handler(_args, flags, ctx) {
      if (flags.text) {
        ctx.print('  Tarek Chaalan')
        ctx.print('  Software Engineer')
        ctx.print('')
        ctx.print('  For full resume, run: resume --open')
        return
      }

      // Default behavior and --open both open in viewer
      ctx.store.openWindow({
        appId: 'app.resumeViewer',
        title: 'Resume Viewer',
        icon: 'icon.pdf',
        rect: { x: 150, y: 80, w: 800, h: 650 },
        minW: 500,
        minH: 400,
      })
      ctx.print('Opened Resume Viewer')
    },
  },

  /* ------------------------------------------------------------------ */
  /*  contact – print contact info                                       */
  /* ------------------------------------------------------------------ */
  {
    name: 'contact',
    description: 'Display contact information',
    handler(_args, _flags, ctx) {
      const children = ctx.vfs.list('/Users/Tarek/Contact')
      if (children.length === 0) {
        ctx.printError('No contact information found.')
        return
      }

      ctx.print('  Contact:')
      ctx.print('')
      for (const node of children) {
        if (node.type === 'link' && node.url) {
          ctx.print(`  ${node.name.padEnd(16)} ${node.url}`)
        } else {
          ctx.print(`  ${node.name}`)
        }
      }
    },
  },
]
