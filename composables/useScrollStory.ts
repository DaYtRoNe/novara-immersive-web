import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scroll } from '~/lib/scroll'
import { RAF_ORDER } from '~/lib/raf'

export interface StoryHelpers {
  /** Viewport height in px. */
  vh: number
  vw: number
  /** Document-space top of an element, in px of scroll. */
  top: (el: Element | null | undefined) => number
  /** Document-space bottom of an element. */
  bottom: (el: Element | null | undefined) => number
}

/**
 * One paused GSAP timeline per page whose *time is measured in scroll pixels*.
 * Sections add tweens at the scroll position where they should happen, and
 * every frame the timeline is seeked to the current (smoothed) scroll.
 *
 * This keeps WebGL state, DOM parallax and colour changes perfectly in sync,
 * and makes scrolling backwards replay everything in reverse for free.
 */
export function useScrollStory(build: (tl: gsap.core.Timeline, h: StoryHelpers) => void) {
  let tl: gsap.core.Timeline | null = null

  const helpers = (): StoryHelpers => ({
    vh: window.innerHeight,
    vw: window.innerWidth,
    top: (el) => (el ? el.getBoundingClientRect().top + scroll.top() : 0),
    bottom: (el) => (el ? el.getBoundingClientRect().bottom + scroll.top() : 0),
  })

  const rebuild = () => {
    tl?.kill()
    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    build(tl, helpers())
    // Pad the end so seeking past the last tween is harmless.
    tl.set({}, {}, Math.max(tl.duration(), scroll.max()))
    tl.seek(scroll.top(), false)
  }

  useRaf(() => tl?.seek(scroll.top(), false), { order: RAF_ORDER.scroll })

  onMounted(() => {
    // After the mount pass, so layout and the ScrollSmoother are in place.
    nextTick(() => {
      rebuild()
      ScrollTrigger.addEventListener('refresh', rebuild)
    })
  })
  onBeforeUnmount(() => {
    ScrollTrigger.removeEventListener('refresh', rebuild)
    tl?.kill()
    tl = null
  })
}
