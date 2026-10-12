import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Loads a muted looping <video> only when its section is about one screen
 * away (so it never slows the preloader), and plays it only while `trigger`
 * is on screen. `src` is the path without extension: `.webm` is used where
 * VP9 is supported, `.mp4` otherwise.
 */
export function useLazyVideo(video: Ref<HTMLVideoElement | null>, trigger: Ref<HTMLElement | null>, src: () => string) {
  let loaded = false
  let onScreen = false

  function load() {
    const el = video.value
    if (!el || loaded) return
    loaded = true
    el.src = `${src()}.${el.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4'}`
    // Setting src cancels any earlier play() request, so re-issue it here.
    if (onScreen) el.play().catch(() => {})
  }

  useScrollTrigger(() => {
    if (!trigger.value) return
    ScrollTrigger.create({ trigger: trigger.value, start: 'top bottom+=100%', once: true, onEnter: load })
    ScrollTrigger.create({
      trigger: trigger.value,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: ({ isActive }) => {
        const el = video.value
        onScreen = isActive
        if (!el) return
        if (!isActive) return el.pause()
        if (!loaded) return load() // load() starts playback itself
        el.play().catch(() => {})
      },
    })
  })

  return { load }
}
