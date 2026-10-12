<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'
import { Smoothed } from '~/lib/lerp'
import { device } from '~/lib/device'
import { playSound, unlockAudio } from '~/lib/audio'

/**
 * Loading screen. It always opens the site by itself once loading is done.
 * A click (or Enter/Space) anywhere while it's showing switches sound on;
 * with no click the site opens muted.
 *
 * Browsers only let audio start inside a user gesture, so the audio context
 * is unlocked right in the click handler, not later when the site opens.
 */
const emit = defineEmits<{ enter: [withSound: boolean] }>()

/** Pause at 100% before opening, so the finished state is readable. */
const HOLD_AT_100_MS = 700

const { loadProgress, loaded, isMuted } = useAppState()
const root = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const percentEl = ref<HTMLElement | null>(null)
const cursor = ref<HTMLElement | null>(null)
const visible = ref(true)
const lineIndex = ref(0)
const ready = ref(false)
const soundOn = ref(false)
const isTouch = ref(false)

// --- displayed progress eases toward the real value (never jumps) --------
const shown = new Smoothed(0, 0.08)
useRaf(
  ({ delta }) => {
    const p = shown.update(loadProgress.value, delta)
    if (bar.value) bar.value.style.transform = `scaleX(${p})`
    if (percentEl.value) percentEl.value.textContent = String(Math.floor(p * 100)).padStart(3, '0')
    if (loaded.value && p > 0.995 && !ready.value) ready.value = true
  },
  { active: visible },
)

// --- "file path" ticker: purely cosmetic ---------------------------------
let tickTimer: ReturnType<typeof setTimeout> | undefined
const tickLines = () => {
  tickTimer = setTimeout(
    () => {
      if (lineIndex.value < site.preloaderLines.length - 1) {
        lineIndex.value++
        tickLines()
      }
    },
    120 + Math.random() * 230,
  )
}
onMounted(tickLines)
onBeforeUnmount(() => clearTimeout(tickTimer))

// --- sound opt-in ---------------------------------------------------------
function enableSound() {
  if (soundOn.value || leaving) return
  soundOn.value = true
  isMuted.value = false
  unlockAudio()
  playSound('click', { throttleMs: 0 })
}

const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  enableSound()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  // A click before hydration was caught by the inline script in nuxt.config.
  // The page already has user activation, so audio may still be unlocked.
  if ((window as Window & { __earlySoundOptIn?: boolean }).__earlySoundOptIn) enableSound()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// --- cursor-follow badge (pointer devices) --------------------------------
// Two speeds: a small dot sticks to the pointer, the badge trails behind it
// and stretches along its direction of travel.
const cursorInner = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)
const cx = new Smoothed(0, 0.12)
const cy = new Smoothed(0, 0.12)
const dx = new Smoothed(0, 0.45)
const dy = new Smoothed(0, 0.45)
const onPointer = (e: PointerEvent) => {
  cx.target = dx.target = e.clientX
  cy.target = dy.target = e.clientY
}
onMounted(() => {
  isTouch.value = device.isTouch
  const x = window.innerWidth / 2
  const y = window.innerHeight * 0.68
  cx.snap(x)
  cy.snap(y)
  dx.snap(x)
  dy.snap(y)
  // Place it before the first frame so it never flashes in the corner.
  if (cursor.value) cursor.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
  window.addEventListener('pointermove', onPointer, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('pointermove', onPointer))
useRaf(
  ({ delta }) => {
    const px = cx.current
    const py = cy.current
    const x = cx.update(undefined, delta)
    const y = cy.update(undefined, delta)
    if (cursor.value) cursor.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (dot.value) dot.value.style.transform = `translate3d(${dx.update(undefined, delta)}px, ${dy.update(undefined, delta)}px, 0)`

    // Squash & stretch from the badge's own speed.
    const vx = x - px
    const vy = y - py
    const stretch = Math.min(Math.hypot(vx, vy) / 60, 0.22)
    const angle = (Math.atan2(vy, vx) * 180) / Math.PI
    if (cursorInner.value)
      cursorInner.value.style.transform = `rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.7}) rotate(${-angle}deg)`
  },
  { active: visible },
)

// --- exit: always automatic once loading is done --------------------------
let leaving = false
async function enter() {
  if (leaving) return
  leaving = true
  window.removeEventListener('keydown', onKey)
  emit('enter', soundOn.value)
  const q = gsap.utils.selector(root)
  await gsap
    .timeline()
    .to(q('.preloader__content'), { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' }, 0)
    // The badge implodes; animate its .badge (not the follow wrappers, whose
    // transforms are written every frame).
    .to(q('.badge'), { scale: 0, autoAlpha: 0, duration: 0.45, ease: 'back.in(2)' }, 0)
    .to(q('.preloader__dot, .preloader__hint .type-mono'), { autoAlpha: 0, duration: 0.3 }, 0)
    .to(root.value, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
  visible.value = false
}

let holdTimer: ReturnType<typeof setTimeout> | undefined
watch(ready, (r) => {
  if (r) holdTimer = setTimeout(enter, HOLD_AT_100_MS)
})
onBeforeUnmount(() => clearTimeout(holdTimer))

const hintText = computed(() => {
  if (soundOn.value) return 'Sound on'
  return isTouch.value ? 'Tap to enable sound' : 'Click to enable sound'
})
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="preloader"
    :class="{ 'is-ready': ready, 'is-sound-on': soundOn, 'is-touch': isTouch }"
    role="dialog"
    aria-modal="true"
    aria-label="Loading"
    @pointerdown="enableSound"
  >
    <div class="preloader__content">
      <div class="preloader__mark">
        <LogoMark motion="pulse" />
      </div>

      <div class="preloader__bar">
        <div ref="bar" class="preloader__progress" />
      </div>

      <div class="preloader__meta type-mono">
        <span class="preloader__label">
          {{ ready ? 'Transmission decoded' : 'Receiving' }} — <span ref="percentEl">000</span>%
        </span>
        <span class="preloader__line" aria-hidden="true">{{ site.preloaderLines[lineIndex] }}</span>
      </div>
    </div>

    <!-- Pointer devices: the badge follows the cursor. Touch: fixed below the bar. -->
    <template v-if="!isTouch">
      <div ref="cursor" class="preloader__cursor" aria-hidden="true">
        <div ref="cursorInner" class="preloader__cursor-inner">
          <SoundBadge :sound-on="soundOn" />
        </div>
      </div>
      <div ref="dot" class="preloader__dot" aria-hidden="true" />
    </template>
    <div v-else class="preloader__hint" aria-hidden="true">
      <SoundBadge :sound-on="soundOn" />
      <span class="type-mono">{{ hintText }}</span>
    </div>

    <p class="visually-hidden" aria-live="polite">
      {{ soundOn ? 'Sound enabled.' : 'Loading. Press Enter to enable sound.' }}
    </p>
  </div>
</template>

<style scoped>
.preloader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: var(--ink);
  clip-path: inset(0 0 0 0);
  cursor: none;
  user-select: none;
}

.preloader.is-touch {
  cursor: auto;
}

.preloader__content {
  width: min(560px, 84vw);
  display: grid;
  gap: 18px;
  pointer-events: none;
}

/* The mark pulses its core and slowly turns its ring (LogoMark motion="pulse"). */
.preloader__mark {
  width: 40px;
  color: var(--signal);
  margin-bottom: 10px;
}

.preloader__bar {
  height: 2px;
  background: var(--faint);
  overflow: hidden;
}

.preloader__progress {
  height: 100%;
  background: var(--bone);
  transform-origin: 0 50%;
  transform: scaleX(0);
}

.preloader__meta {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  color: var(--dim);
}

.preloader__line {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 55%;
}

@media (max-width: 767px) {
  .preloader__line {
    display: none;
  }
}

/* ---- sound hint ---- */
.preloader__cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  will-change: transform;
  /* Same start point the script snaps to, so the server-rendered HTML
     shows it in place before hydration. */
  transform: translate3d(50vw, 68vh, 0);
}

/* Centre the badge on the pointer; the inner wrapper carries the stretch. */
.preloader__cursor-inner {
  margin: -70px 0 0 -70px;
  will-change: transform;
}

/* Small precise dot that sticks to the pointer. */
.preloader__dot {
  position: fixed;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--signal);
  pointer-events: none;
  transform: translate3d(50vw, 68vh, 0);
  box-shadow: 0 0 0 2px var(--ink);
}

/* Touch: the badge sits still below the bar with a caption. */
.preloader__hint {
  position: fixed;
  left: 50%;
  bottom: 12vh;
  display: grid;
  justify-items: center;
  gap: 14px;
  transform: translateX(-50%);
  color: var(--dim);
}
</style>
