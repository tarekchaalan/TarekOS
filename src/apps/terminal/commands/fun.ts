import type { CommandDef } from './index'

/* ------------------------------------------------------------------ */
/*  Fun / utility commands                                             */
/* ------------------------------------------------------------------ */

export const funCommands: CommandDef[] = [
  /* ------------------------------------------------------------------ */
  /*  neofetch – display system info with ASCII art                      */
  /* ------------------------------------------------------------------ */
  {
    name: 'neofetch',
    description: 'Display system information with ASCII art',
    handler(_args, _flags, ctx) {
      const uptimeMs = performance.now()
      const uptimeSec = Math.floor(uptimeMs / 1000)
      const uptimeMin = Math.floor(uptimeSec / 60)
      const uptimeHrs = Math.floor(uptimeMin / 60)
      const uptimeStr =
        uptimeHrs > 0
          ? `${uptimeHrs}h ${uptimeMin % 60}m ${uptimeSec % 60}s`
          : uptimeMin > 0
            ? `${uptimeMin}m ${uptimeSec % 60}s`
            : `${uptimeSec}s`

      const resolution = `${window.innerWidth}x${window.innerHeight}`
      const theme = ctx.store.theme

      const art = [
        ' ████████╗ ',
        ' ╚══██╔══╝ ',
        '    ██║    ',
        '    ██║    ',
        '    ██║    ',
        '    ╚═╝    ',
        '           ',
      ]

      const info = [
        `  tarek@portfolio`,
        `  ─────────────────`,
        `  OS:         TarekOS v1.0.0`,
        `  Host:       Portfolio`,
        `  Kernel:     React 19`,
        `  Shell:      TarekShell`,
        `  Theme:      ${theme}`,
        `  Resolution: ${resolution}`,
        `  Uptime:     ${uptimeStr}`,
      ]

      const lines = Math.max(art.length, info.length)
      for (let i = 0; i < lines; i++) {
        const left = i < art.length ? art[i] : '           '
        const right = i < info.length ? info[i] : ''
        ctx.print(`${left}${right}`)
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  date – print current date and time                                 */
  /* ------------------------------------------------------------------ */
  {
    name: 'date',
    description: 'Print current date and time',
    handler(_args, _flags, ctx) {
      ctx.print(`  ${new Date().toString()}`)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  echo – print arguments                                             */
  /* ------------------------------------------------------------------ */
  {
    name: 'echo',
    description: 'Print arguments to the terminal',
    usage: 'echo <text...>',
    handler(args, _flags, ctx) {
      ctx.print(args.join(' '))
    },
  },

  /* ------------------------------------------------------------------ */
  /*  theme – get or set the current theme                               */
  /* ------------------------------------------------------------------ */
  {
    name: 'theme',
    description: 'Get or set the current theme',
    usage: 'theme [light|dark]',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.print(`  Current theme: ${ctx.store.theme}`)
        return
      }

      const value = args[0]
      if (value !== 'light' && value !== 'dark') {
        ctx.printError(`Invalid theme: ${value}. Use 'light' or 'dark'.`)
        return
      }

      ctx.store.setTheme(value)
      ctx.print(`  Theme set to: ${value}`)
    },
  },
]
