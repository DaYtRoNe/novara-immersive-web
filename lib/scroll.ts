import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { clamp } from './lerp'

let smoother: ScrollSmoother | null = null
let scrollTween: gsap.core.Tween | null = null

/** Thin wrapper around ScrollSmoother so the rest of the app never touches it directly. */
export const scroll = {
  create(wrapper: HTMLElement, content: HTMLElement, opts: { smooth: number; onUpdate?: (self: ScrollSmoother) => void }) {
    smoother?.kill()
    smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: opts.smooth,
      smoothTouch: false,
      effects: false,
      normalizeScroll: false,
      onUpdate: opts.onUpdate,
    })
    return smoother
  },

  kill() {
    smoother?.kill()
    smoother = null
  },

  get instance() {
    return smoother
  },

  /** Smoothed scroll position in px (what the user sees). */
  top() {
    return smoother ? smoother.scrollTop() : typeof window !== 'undefined' ? window.scrollY : 0
  },

  max() {
    return ScrollTrigger.maxScroll(window)
  },

  velocity() {
    return smoother ? smoother.getVelocity() : 0
  },

  setPaused(paused: boolean) {
    smoother?.paused(paused)
  },

  /**
   * Scrolls to an element, selector or pixel value. Duration grows with
   * distance (so short hops feel snappy and long jumps don't teleport).
   */
  to(target: string | HTMLElement | number, { immediate = false, offset = 0 } = {}) {
    const from = scroll.top()
    let y: number
    if (typeof target === 'number') y = target
    else {
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
      if (!el) return
      y = smoother ? smoother.offset(el, 'top top') : el.getBoundingClientRect().top + window.scrollY
    }
    y = clamp(y - offset, 0, scroll.max())

    scrollTween?.kill()
    if (immediate) {
      smoother ? smoother.scrollTop(y) : window.scrollTo(0, y)
      return
    }
    const proxy = { y: from }
    scrollTween = gsap.to(proxy, {
      y,
      duration: clamp(Math.abs(y - from) * 0.0005, 0.6, 2.2),
      ease: 'power3.inOut',
      onUpdate: () => (smoother ? smoother.scrollTop(proxy.y) : window.scrollTo(0, proxy.y)),
    })
  },

  refresh() {
    ScrollTrigger.refresh()
  },
}
