type Handler<T> = (payload: T) => void

/** Minimal typed event emitter. */
export class Emitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {}

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    ;(this.handlers[event] ??= new Set()).add(handler)
    return () => this.off(event, handler)
  }

  once<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const off = this.on(event, (payload) => {
      off()
      handler(payload)
    })
    return off
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    this.handlers[event]?.delete(handler)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.handlers[event]?.forEach((h) => h(payload))
  }

  clear() {
    this.handlers = {}
  }
}
