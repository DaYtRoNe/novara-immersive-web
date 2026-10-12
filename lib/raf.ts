import { gsap } from 'gsap'

export interface FrameInfo {
  /** Seconds since the ticker started. */
  time: number
  /** Milliseconds since the previous frame. */
  delta: number
  frame: number
}

type FrameCallback = (info: FrameInfo) => void

interface Subscriber {
  fn: FrameCallback
  order: number
}

/**
 * One frame loop for the whole site, driven by gsap.ticker so GSAP tweens,
 * DOM updates and the WebGL render all happen in the same frame.
 * Lower `order` runs first (e.g. scroll → scene updates → render).
 */
class RafManager {
  private subs: Subscriber[] = []
  private running = false

  private tick = (time: number, delta: number, frame: number) => {
    const info = { time, delta, frame }
    for (const sub of this.subs) sub.fn(info)
  }

  add(fn: FrameCallback, order = 0) {
    if (this.subs.some((s) => s.fn === fn)) return
    this.subs.push({ fn, order })
    this.subs.sort((a, b) => a.order - b.order)
    if (!this.running) {
      this.running = true
      gsap.ticker.add(this.tick)
    }
  }

  remove(fn: FrameCallback) {
    this.subs = this.subs.filter((s) => s.fn !== fn)
    if (this.running && this.subs.length === 0) {
      this.running = false
      gsap.ticker.remove(this.tick)
    }
  }

  nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

export const raf = new RafManager()

/** Frame order presets so callers don't invent magic numbers. */
export const RAF_ORDER = {
  input: -20,
  scroll: -10,
  update: 0,
  render: 100,
} as const
