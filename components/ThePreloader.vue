<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'
import { Smoothed } from '~/lib/lerp'
import { device } from '~/lib/device'

const emit = defineEmits<{ enter: [withSound: boolean] }>()

const { loadProgress, loaded } = useAppState()
const root = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const percentEl = ref<HTMLElement | null>(null)
const cursor = ref<HTMLElement | null>(null)
const visible = ref(true)
const lineIndex = ref(0)
const ready = ref(false)

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

// --- cursor-follow CTA (desktop only) -------------------------------------
const cx = new Smoothed(0, 0.18)
const cy = new Smoothed(0, 0.18)
const onPointer = (e: PointerEvent) => {
  cx.target = e.clientX
  cy.target = e.clientY
}
onMounted(() => {
  cx.snap(window.innerWidth / 2)
  cy.snap(window.innerHeight * 0.7)
  window.addEventListener('pointermove', onPointer, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('pointermove', onPointer))
useRaf(
  ({ delta }) => {
    if (cursor.value) cursor.value.style.transform = `translate3d(${cx.update(undefined, delta)}px, ${cy.update(undefined, delta)}px, 0)`
  },
  { active: ready },
)

// --- exit -----------------------------------------------------------------
let leaving = false
async function enter(withSound: boolean) {
  if (!ready.value || leaving) return
  leaving = true
  emit('enter', withSound)
  await gsap
    .timeline()
    .to('.preloader__content', { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
    .to(root.value, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
  visible.value = false
}

const onBackdropClick = () => {
  if (!device.isTouch) enter(true)
}

watch(ready, async (r) => {
  if (!r) return
  await nextTick()
  gsap.from('.preloader__enter > *', { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.6 })
  root.value?.querySelector<HTMLElement>('.preloader__enter button')?.focus({ preventScroll: true })
})
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="preloader"
    :class="{ 'is-ready': ready }"
    role="dialog"
    aria-modal="true"
    aria-label="Loading"
    @click.self="onBackdropClick"
  >
    <div class="preloader__content" @click.self="onBackdropClick">
      <div class="preloader__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 3 L37 33 H3 Z" />
          <path d="M20 14 L28 28 H12 Z" />
        </svg>
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

      <div v-if="ready" class="preloader__enter">
        <button type="button" class="enter-btn" @click="enter(true)">
          <BtnAudio :interactive="false" />
          <span>Enter with sound</span>
        </button>
        <button type="button" class="enter-muted type-mono" @click="enter(false)">or enter muted</button>
      </div>
    </div>

    <div v-if="ready" ref="cursor" class="preloader__cursor type-mono" aria-hidden="true">
      <span>Click to enter</span>
    </div>
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
}

.preloader.is-ready {
  cursor: none;
}

@media (hover: none) {
  .preloader.is-ready {
    cursor: auto;
  }
}

.preloader__content {
  width: min(560px, 84vw);
  display: grid;
  gap: 18px;
}

.preloader__mark {
  width: 34px;
  color: var(--signal);
  margin-bottom: 10px;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
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

.preloader__enter {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 26px;
  flex-wrap: wrap;
}

.enter-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  background: var(--bone);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  transition: background 0.25s;
}

.enter-btn:hover {
  background: var(--signal);
}

.enter-muted {
  color: var(--dim);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.preloader__cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  will-change: transform;
}

.preloader__cursor span {
  display: block;
  transform: translate(-50%, -50%);
  padding: 8px 12px;
  border: 1px solid var(--bone);
  border-radius: 999px;
  background: rgb(7 9 12 / 0.7);
  white-space: nowrap;
}

@media (hover: none) {
  .preloader__cursor {
    display: none;
  }
}
</style>
