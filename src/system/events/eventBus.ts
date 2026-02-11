type EventHandler = (...args: unknown[]) => void

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(...args)
      } catch (e) {
        console.error(`Event handler error for "${event}":`, e)
      }
    })
  }
}

export const eventBus = new EventBus()
