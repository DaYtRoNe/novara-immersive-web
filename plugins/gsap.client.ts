import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin)
  gsap.defaults({ ease: 'power3.out', duration: 0.8 })
  // Keep animation time honest after a backgrounded tab instead of jumping.
  gsap.ticker.lagSmoothing(500, 33)
})
