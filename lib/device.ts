const hasWindow = typeof window !== 'undefined'

export const device = {
  get isTouch() {
    return hasWindow && window.matchMedia('(hover: none), (pointer: coarse)').matches
  },
  get isMobile() {
    return hasWindow && window.matchMedia('(max-width: 767px)').matches
  },
  get reducedMotion() {
    return hasWindow && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  get webgl() {
    if (!hasWindow) return false
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      return false
    }
  },
}
