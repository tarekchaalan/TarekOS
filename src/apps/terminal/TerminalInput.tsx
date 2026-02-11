import { useState, useRef, useEffect, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { getCompletions } from './commands/completer'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TerminalInputProps {
  prompt: string
  cwd: string
  onSubmit: (input: string) => void
  history: string[]
  historyIndex: number
  onHistoryChange: (index: number) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TerminalInput({
  prompt,
  cwd,
  onSubmit,
  history,
  historyIndex,
  onHistoryChange,
}: TerminalInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /* Auto-focus on mount */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /* Sync input value when navigating history */
  useEffect(() => {
    if (historyIndex === -1) {
      setValue('')
    } else {
      const idx = history.length - 1 - historyIndex
      if (idx >= 0 && idx < history.length) {
        setValue(history[idx])
      }
    }
  }, [historyIndex, history])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      /* Enter — submit */
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit(value)
        setValue('')
        onHistoryChange(-1)
        return
      }

      /* ArrowUp — older history */
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (history.length === 0) return
        const next = historyIndex + 1
        if (next < history.length) {
          onHistoryChange(next)
        }
        return
      }

      /* ArrowDown — newer history */
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (historyIndex <= 0) {
          onHistoryChange(-1)
          setValue('')
        } else {
          onHistoryChange(historyIndex - 1)
        }
        return
      }

      /* Ctrl+L — clear */
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        onSubmit('clear')
        setValue('')
        return
      }

      /* Ctrl+C — cancel current input */
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        setValue('')
        onHistoryChange(-1)
        return
      }

      /* Tab — command + path completion */
      if (e.key === 'Tab') {
        e.preventDefault()
        const input = value
        if (!input.trim()) return

        const matches = getCompletions(input, cwd)
        if (matches.length === 1) {
          // Single match — auto-complete
          const parts = input.split(' ')
          if (parts.length <= 1) {
            // Completing a command name
            setValue(matches[0])
          } else {
            // Completing a path argument — replace the last token
            parts[parts.length - 1] = matches[0]
            setValue(parts.join(' '))
          }
        }
        return
      }
    },
    [value, cwd, onSubmit, history, historyIndex, onHistoryChange],
  )

  return (
    <div className="flex items-center gap-2 px-4 pb-3 pt-1 font-mono text-[13px]">
      <span className="shrink-0 text-[#6ee7b7]">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1 border-none bg-transparent text-[#e0e0e8] caret-[#6ee7b7] outline-none placeholder:text-[#4a4a5a]"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  )
}
