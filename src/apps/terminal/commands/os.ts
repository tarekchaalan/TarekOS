import type { CommandDef } from './index'
import { resolveTarget, getAppDefinition, getAppRegistry } from '@/system/openTarget'

export const osCommands: CommandDef[] = [
  /* ------------------------------------------------------------------ */
  /*  apps – list all registered applications                            */
  /* ------------------------------------------------------------------ */
  {
    name: 'apps',
    description: 'List all registered applications',
    handler(_args, _flags, ctx) {
      const registry = getAppRegistry()
      ctx.print('  ID                  NAME                SINGLETON')
      ctx.print('  ──────────────────  ──────────────────  ─────────')
      for (const app of registry.apps) {
        const id = app.id.padEnd(20)
        const name = app.name.padEnd(20)
        const singleton = app.singleton ? 'yes' : 'no'
        ctx.print(`  ${id}${name}${singleton}`)
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  start – open an app by id                                          */
  /* ------------------------------------------------------------------ */
  {
    name: 'start',
    description: 'Open an application by id',
    usage: 'start <appId>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError("Usage: start <appId>  (e.g. 'start terminal', 'start browser')")
        return
      }

      const appId = `app.${args[0]}`
      const resolved = resolveTarget({ kind: 'app', appId })
      if (!resolved) {
        ctx.printError(`Unknown app: ${args[0]}`)
        return
      }

      const app = getAppDefinition(appId)
      if (!app) {
        ctx.printError(`No definition found for: ${args[0]}`)
        return
      }

      ctx.store.openWindow({
        appId: resolved.appId,
        title: resolved.title,
        icon: resolved.icon,
        rect: {
          x: 150,
          y: 100,
          w: app.defaultWindow.w,
          h: app.defaultWindow.h,
        },
        minW: app.defaultWindow.minW,
        minH: app.defaultWindow.minH,
        payload: resolved.payload,
      })

      ctx.print(`Opened ${app.name}`)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  windows – list all open windows                                    */
  /* ------------------------------------------------------------------ */
  {
    name: 'windows',
    description: 'List all open windows',
    handler(_args, _flags, ctx) {
      const wins = Object.values(ctx.store.windows)
      if (wins.length === 0) {
        ctx.print('  No open windows.')
        return
      }

      ctx.print('  ID            TITLE                     APP                 MODE        FOCUSED')
      ctx.print('  ────────────  ────────────────────────  ──────────────────  ──────────  ───────')
      for (const w of wins) {
        const id = w.id.padEnd(14)
        const title = w.title.slice(0, 24).padEnd(24)
        const app = w.appId.padEnd(20)
        const mode = w.mode.padEnd(12)
        const focused = w.focused ? '*' : ''
        ctx.print(`  ${id}${title}${app}${mode}${focused}`)
      }
    },
  },

  /* ------------------------------------------------------------------ */
  /*  focus – focus a window by id                                       */
  /* ------------------------------------------------------------------ */
  {
    name: 'focus',
    description: 'Focus a window by id',
    usage: 'focus <windowId>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('Usage: focus <windowId>')
        return
      }

      const id = args[0]
      if (!ctx.store.windows[id]) {
        ctx.printError(`No window with id: ${id}`)
        return
      }

      ctx.store.focusWindow(id)
      ctx.print(`Focused window ${id}`)
    },
  },

  /* ------------------------------------------------------------------ */
  /*  close – close a window by id                                       */
  /* ------------------------------------------------------------------ */
  {
    name: 'close',
    description: 'Close a window by id',
    usage: 'close <windowId>',
    handler(args, _flags, ctx) {
      if (args.length === 0) {
        ctx.printError('Usage: close <windowId>')
        return
      }

      const id = args[0]
      if (!ctx.store.windows[id]) {
        ctx.printError(`No window with id: ${id}`)
        return
      }

      ctx.store.closeWindow(id)
      ctx.print(`Closed window ${id}`)
    },
  },
]
