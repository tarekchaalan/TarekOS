import { useRef, useEffect } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TerminalLine {
  id: number
  type: 'input' | 'output' | 'error'
  content: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TerminalOutputProps {
  lines: TerminalLine[]
}

export function TerminalOutput({ lines }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-3 font-mono text-[13px] leading-relaxed">
      {lines.map((line) => (
        <div
          key={line.id}
          className={
            line.type === 'input'
              ? 'text-[#8a8a9a] whitespace-pre-wrap break-all'
              : line.type === 'error'
                ? 'text-red-400 whitespace-pre-wrap break-all'
                : 'text-[#e0e0e8] whitespace-pre-wrap break-all'
          }
        >
          {line.content}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
