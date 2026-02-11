import { useState, useCallback } from 'react'
import { useStore } from '@/system/store'
import { playSound } from '@/system/sounds/sounds'

export function ShutdownOverlay() {
  const cancelShutdown = useStore((s) => s.cancelShutdown)
  const [shuttingDown, setShuttingDown] = useState(false)

  const handleShutdown = useCallback(() => {
    playSound('shutdown')
    setShuttingDown(true)

    // After 2.5s, attempt to close tab — fall back to black screen
    setTimeout(() => {
      // window.close() only works for tabs opened via window.open().
      // Check opener to avoid the browser warning for user-opened tabs.
      if (window.opener) window.close()
    }, 2500)
  }, [])

  // Shutting-down state: full black screen
  if (shuttingDown) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
        <p className="animate-pulse text-lg text-white/70">Shutting down...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Dialog box */}
      <div
        className="flex w-[400px] flex-col overflow-hidden rounded-lg border border-[rgba(255,255,255,0.15)]"
        style={{
          background: 'linear-gradient(180deg, #4a7dc4 0%, #3568a8 40%, #2d5a94 100%)',
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <h2
            className="text-[15px] font-semibold text-white"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            What do you want the computer to do?
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-[12px] leading-relaxed text-white/80">
            Choose &quot;Shut Down&quot; to close all programs and turn off the computer.
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.2)] px-6 py-4"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 100%)',
          }}
        >
          <button
            onClick={handleShutdown}
            className="rounded px-5 py-1.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg, rgba(120,160,210,0.95) 0%, rgba(70,110,170,1) 50%, rgba(50,90,150,1) 100%)',
              border: '1px solid rgba(40,70,120,0.8)',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            Shut Down
          </button>
          <button
            onClick={cancelShutdown}
            className="rounded px-5 py-1.5 text-[13px] font-medium text-white/90 transition-all hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
