<script setup lang="ts">
import { gsap } from 'gsap'
import { scroll } from '~/lib/scroll'
import { Smoothed, clamp } from '~/lib/lerp'
import { fadeSound } from '~/lib/audio'

/** Full-screen player opened via `useAppState().video`. */
const { video, isMuted } = useAppState()

const root = ref<HTMLElement | null>(null)
const player = ref<HTMLVideoElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const fill = ref<HTMLElement | null>(null)
const cursor = ref<HTMLElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)
const scrubbing = ref(false)
const pointerInside = ref(false)

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const timeLabel = computed(() => `${fmt(current.value)} / ${fmt(duration.value)}`)

// ---- open / close ----------------------------------------------------------
watch(video, async (v) => {
  if (v) {
    scroll.setPaused(true)
    fadeSound('ambient', 0, 600)
    await nextTick()
    gsap.fromTo(root.value, { clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
    player.value?.play().catch(() => {})
    root.value?.querySelector<HTMLElement>('.vo__close')?.focus({ preventScroll: true })
  }
})

async function close() {
  if (!root.value) return
  player.value?.pause()
  await gsap.to(root.value, { clipPath: 'inset(50% 0 50% 0)', duration: 0.6, ease: 'expo.inOut' })
  video.value = null
  scroll.setPaused(false)
  fadeSound('ambient', 0.32, 1200)
}

// ---- playback --------------------------------------------------------------
const togglePlay = () => {
  const v = player.value
  if (!v) return
  v.paused ? v.play() : v.pause()
}

const toggleFullscreen = () => {
  const el = root.value as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null
  if (document.fullscreenElement) document.exitFullscreen()
  else if (el?.requestFullscreen) el.requestFullscreen()
  else player.value && (player.value as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.()
}

// Progress is drawn every frame (smoother than relying on timeupdate events).
useRaf(
  () => {
    const v = player.value
    if (!v || !v.duration) return
    current.value = v.currentTime
    duration.value = v.duration
    if (fill.value) fill.value.style.transform = `scaleX(${v.currentTime / v.duration})`
  },
  { active: computed(() => !!video.value) },
)

// ---- scrubbing: press on the bar and drag ---------------------------------
const seekFromPointer = (e: PointerEvent) => {
  const v = player.value
  if (!v || !bar.value || !v.duration) return
  const rect = bar.value.getBoundingClientRect()
  v.currentTime = clamp((e.clientX - rect.left) / rect.width) * v.duration
}
const onBarDown = (e: PointerEvent) => {
  scrubbing.value = true
  bar.value?.setPointerCapture(e.pointerId)
  seekFromPointer(e)
}
const onBarMove = (e: PointerEvent) => scrubbing.value && seekFromPointer(e)
const onBarUp = () => (scrubbing.value = false)

const onBarKey = (e: KeyboardEvent) => {
  const v = player.value
  if (!v) return
  if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 2)
  if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 2)
}

// ---- cursor label that trails the pointer ---------------------------------
const cx = new Smoothed(0, 0.2)
const cy = new Smoothed(0, 0.2)
const onMove = (e: PointerEvent) => {
  cx.target = e.clientX
  cy.target = e.clientY
}
useRaf(
  ({ delta }) => {
    if (cursor.value) cursor.value.style.transform = `translate3d(${cx.update(undefined, delta)}px, ${cy.update(undefined, delta)}px, 0)`
  },
  { active: pointerInside },
)

const onKey = (e: KeyboardEvent) => {
  if (!video.value) return
  if (e.key === 'Escape') close()
  if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
    e.preventDefault()
    togglePlay()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="video" ref="root" class="vo" role="dialog" aria-modal="true" :aria-label="video.title">
    <video
      ref="player"
      class="vo__video"
      playsinline
      preload="auto"
      :muted="isMuted"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
    >
      <source :src="`${video.src}.webm`" type="video/webm" />
      <source :src="`${video.src}.mp4`" type="video/mp4" />
    </video>

    <div
      class="vo__surface"
      @click="togglePlay"
      @pointermove="onMove"
      @pointerenter="pointerInside = true"
      @pointerleave="pointerInside = false"
    />

    <div v-show="pointerInside" ref="cursor" class="vo__cursor type-mono" aria-hidden="true">
      <span>{{ playing ? 'Pause' : 'Play' }}</span>
    </div>

    <header class="vo__top">
      <span class="type-mono">{{ video.title }}</span>
      <HoverSfx>
        <button class="vo__close type-mono" type="button" @click="close"><LinkHover>Close ✕</LinkHover></button>
      </HoverSfx>
    </header>

    <footer class="vo__controls">
      <HoverSfx>
        <button class="vo__btn type-mono" type="button" @click="togglePlay">{{ playing ? 'Pause' : 'Play' }}</button>
      </HoverSfx>

      <div
        ref="bar"
        class="vo__bar"
        :class="{ 'is-scrubbing': scrubbing }"
        role="slider"
        tabindex="0"
        aria-label="Seek"
        :aria-valuemin="0"
        :aria-valuemax="Math.round(duration)"
        :aria-valuenow="Math.round(current)"
        :aria-valuetext="timeLabel"
        @pointerdown="onBarDown"
        @pointermove="onBarMove"
        @pointerup="onBarUp"
        @pointercancel="onBarUp"
        @keydown="onBarKey"
      >
        <span ref="fill" class="vo__fill" />
      </div>

      <span class="vo__time type-mono">{{ timeLabel }}</span>
      <HoverSfx><BtnAudio /></HoverSfx>
      <HoverSfx>
        <button class="vo__btn type-mono" type="button" @click="toggleFullscreen">Full</button>
      </HoverSfx>
    </footer>
  </div>
</template>

<style scoped>
.vo {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: #000;
}

.vo__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vo__surface {
  position: absolute;
  inset: 0;
  cursor: none;
}

@media (hover: none) {
  .vo__surface {
    cursor: auto;
  }
}

.vo__cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 2;
}

.vo__cursor span {
  display: block;
  transform: translate(-50%, -50%);
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--bone);
  color: var(--ink);
}

.vo__top,
.vo__controls {
  position: absolute;
  left: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  z-index: 3;
}

.vo__top {
  top: 20px;
  justify-content: space-between;
}

.vo__controls {
  bottom: 22px;
}

.vo__btn {
  padding: 8px 4px;
}

.vo__bar {
  flex: 1;
  height: 22px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
  position: relative;
}

.vo__bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--faint);
}

.vo__fill {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--signal);
  transform-origin: 0 50%;
  transform: scaleX(0);
  transition: height 0.2s;
}

.vo__bar:hover .vo__fill,
.is-scrubbing .vo__fill {
  height: 4px;
}

.vo__time {
  min-width: 9ch;
  text-align: right;
  color: var(--dim);
}
</style>
