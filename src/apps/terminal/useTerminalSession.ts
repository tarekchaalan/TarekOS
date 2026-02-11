import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/system/store'
import { vfs } from '@/system/vfs/vfs.seed'
import { displayPath } from '@/shared/utils/path'
import { executeCommand } from './commands'
import type { CommandContext } from './commands'
import type { TerminalLine } from './TerminalOutput'

export function useTerminalSession() {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [cwd, setCwd] = useState('/Users/Tarek')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const lineIdCounter = useRef(0)
  const store = useStore()

  const prompt = `tarek@portfolio:${displayPath(cwd)}$`

  const nextId = () => {
    lineIdCounter.current += 1
    return lineIdCounter.current
  }

  const clear = useCallback(() => {
    setLines([])
  }, [])

  const execute = useCallback(
    async (input: string) => {
      const trimmed = input.trim()
      if (!trimmed) return

      /* Special case: clear bypasses normal output */
      if (trimmed === 'clear') {
        clear()
        setHistory((prev) => [...prev, trimmed])
        setHistoryIndex(-1)
        return
      }

      const currentPrompt = `tarek@portfolio:${displayPath(cwd)}$`

      /* Collect output produced by the command */
      const outputLines: TerminalLine[] = []

      const ctx: CommandContext = {
        cwd,
        setCwd: () => {
          /* handled via result.newCwd */
        },
        vfs,
        store,
        print: (...msgs: string[]) => {
          for (const msg of msgs) {
            outputLines.push({ id: nextId(), type: 'output', content: msg })
          }
        },
        printError: (msg: string) => {
          outputLines.push({ id: nextId(), type: 'error', content: msg })
        },
        clear,
      }

      /* Add the input line */
      const inputLine: TerminalLine = {
        id: nextId(),
        type: 'input',
        content: `${currentPrompt} ${trimmed}`,
      }

      const result = await executeCommand(trimmed, ctx)

      setLines((prev) => [...prev, inputLine, ...outputLines])

      /* Update history */
      setHistory((prev) => [...prev, trimmed])
      setHistoryIndex(-1)

      /* Update cwd if the command changed it */
      if (result?.newCwd) {
        setCwd(result.newCwd)
      }
    },
    [cwd, store, clear],
  )

  const printWelcome = useCallback(() => {
    setLines((prev) => [
      ...prev,
      { id: nextId(), type: 'output', content: 'Welcome to TarekOS Terminal v1.0.0' },
      {
        id: nextId(),
        type: 'output',
        content: "Type 'help' for available commands, or 'whoami' to learn about me.",
      },
      { id: nextId(), type: 'output', content: '' },
    ])
  }, [])

  return {
    lines,
    cwd,
    prompt,
    history,
    historyIndex,
    setHistoryIndex,
    execute,
    clear,
    printWelcome,
  }
}
