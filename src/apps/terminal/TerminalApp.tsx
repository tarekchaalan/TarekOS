import { useRef, useEffect } from 'react'
import { TerminalOutput } from './TerminalOutput'
import { TerminalInput } from './TerminalInput'
import { useTerminalSession } from './useTerminalSession'

/* ------------------------------------------------------------------ */
/*  Terminal App                                                       */
/* ------------------------------------------------------------------ */

export default function TerminalApp({
  windowId: _windowId,
}: {
  windowId: string
  payload?: unknown
}) {
  const {
    lines,
    cwd,
    prompt,
    history,
    historyIndex,
    setHistoryIndex,
    execute,
    clear,
    printWelcome,
  } = useTerminalSession()

  const hasInitialized = useRef(false)

  /* Print welcome message on mount */
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    printWelcome()
  }, [printWelcome])

  return (
    <div className="flex h-full flex-col bg-[#0c0c14] font-mono text-[13px] text-[#e0e0e8]">
      {/* Output buffer */}
      <TerminalOutput lines={lines} />

      {/* Input */}
      <TerminalInput
        prompt={prompt}
        cwd={cwd}
        onSubmit={(input) => {
          if (input.trim() === 'clear') {
            clear()
          } else {
            execute(input)
          }
        }}
        history={history}
        historyIndex={historyIndex}
        onHistoryChange={setHistoryIndex}
      />
    </div>
  )
}
