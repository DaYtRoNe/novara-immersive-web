import { gsap } from 'gsap'

/**
 * Builds GSAP animations / ScrollTriggers inside a gsap.context so they are
 * all reverted together on unmount, and rebuilt when the viewport crosses
 * the mobile breakpoint (layouts differ, so measurements would be stale).
 */
export function useScrollTrigger(build: (ctx: gsap.Context) => void, scope?: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null
  let mq: MediaQueryList | null = null
  let alive = true

  const init = () => {
    if (!alive) return
    ctx?.revert()
    ctx = gsap.context((self) => build(self), scope?.value ?? undefined)
  }
  const destroy = () => {
    ctx?.revert()
    ctx = null
  }

  onMounted(() => {
    // Children mount before <SmoothScroll>; wait for the whole mount pass so
    // the ScrollSmoother exists before any ScrollTrigger is created.
    nextTick(init)
    mq = window.matchMedia('(max-width: 767px)')
    mq.addEventListener('change', init)
  })
  onBeforeUnmount(() => {
    alive = false
    mq?.removeEventListener('change', init)
    destroy()
  })

  return { init, destroy }
}
