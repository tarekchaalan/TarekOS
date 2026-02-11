type ToastType = 'info' | 'success' | 'error' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

type Listener = (toasts: Toast[]) => void

let nextId = 1
let toasts: Toast[] = []
const listeners = new Set<Listener>()

function notify() {
  for (const fn of listeners) fn([...toasts])
}

export function addToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = nextId++
  toasts.push({ id, message, type, duration })
  notify()
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

export function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getToasts(): Toast[] {
  return [...toasts]
}

export type { Toast, ToastType }
