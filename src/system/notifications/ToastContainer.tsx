import { useEffect, useState } from 'react'
import { subscribeToasts, getToasts, removeToast, type Toast } from './toast'
import { TASKBAR_HEIGHT } from '@/shared/constants'

const TYPE_STYLES: Record<string, string> = {
  info: 'border-l-[#4580c4]',
  success: 'border-l-[#10b981]',
  error: 'border-l-[#ef4444]',
  warning: 'border-l-[#f59e0b]',
}

function ToastItem({ toast }: { toast: Toast }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), toast.duration - 300)
    return () => clearTimeout(timer)
  }, [toast.duration])

  return (
    <div
      className={`flex items-center gap-3 rounded border-l-4 bg-[#f2f2f2] px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 ${
        TYPE_STYLES[toast.type] ?? TYPE_STYLES.info
      } ${exiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}
      style={{ minWidth: 250, maxWidth: 350 }}
    >
      <span className="flex-1 text-[12px] text-[#1a1a1a]">{toast.message}</span>
      <button
        className="ml-2 text-[10px] text-[#888] hover:text-[#333]"
        onClick={() => removeToast(toast.id)}
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(getToasts)

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-auto fixed right-4 z-[99998] flex flex-col-reverse gap-2"
      style={{ bottom: TASKBAR_HEIGHT + 12 }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
