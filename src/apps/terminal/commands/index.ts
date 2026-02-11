import type { Vfs } from '@/system/vfs/vfs'
import type { StoreState } from '@/system/store'
import { parseCommand } from './parser'
import { navCommands } from './nav'
import { osCommands } from './os'
import { portfolioCommands } from './portfolio'
import { funCommands } from './fun'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CommandContext {
  cwd: string
  setCwd: (path: string) => void
  vfs: Vfs
  store: StoreState
  print: (...lines: string[]) => void
  printError: (msg: string) => void
  clear: () => void
}

export interface CommandResult {
  /** If set, replaces cwd after execution */
  newCwd?: string
}

export type CommandHandler = (
  args: string[],
  flags: Record<string, string | boolean>,
  ctx: CommandContext,
) => CommandResult | Promise<CommandResult> | void | Promise<void>

export interface CommandDef {
  name: string
  description: string
  usage?: string
  handler: CommandHandler
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

const commands = new Map<string, CommandDef>()

export function registerCommand(def: CommandDef) {
  commands.set(def.name, def)
}

export function getCommand(name: string): CommandDef | undefined {
  return commands.get(name)
}

export function getAllCommands(): CommandDef[] {
  return Array.from(commands.values())
}

export function getCommandNames(): string[] {
  return Array.from(commands.keys()).sort()
}

/* ------------------------------------------------------------------ */
/*  Register all command modules                                       */
/* ------------------------------------------------------------------ */

for (const cmd of [...navCommands, ...osCommands, ...portfolioCommands, ...funCommands]) {
  registerCommand(cmd)
}

/* ------------------------------------------------------------------ */
/*  Executor                                                           */
/* ------------------------------------------------------------------ */

export async function executeCommand(
  input: string,
  ctx: CommandContext,
): Promise<CommandResult | void> {
  const parsed = parseCommand(input)
  if (!parsed.command) return

  const cmd = commands.get(parsed.command)
  if (!cmd) {
    ctx.printError(`${parsed.command}: command not found. Type 'help' for available commands.`)
    return
  }

  return cmd.handler(parsed.args, parsed.flags, ctx)
}
