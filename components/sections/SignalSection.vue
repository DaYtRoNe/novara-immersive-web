<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { site } from '~/content/site'
import { assetLoader, fetchWithProgress } from '~/lib/loader'
import { createVideoMaterial } from '~/lib/gl/materials'
import type { Stage } from '~/lib/gl/Stage'

const s = site.signal
const { video } = useAppState()

const card = ref<HTMLElement | null>(null)
const texVideo = ref<HTMLVideoElement | null>(null)
const hovering = useHover(card)
let objectUrl: string | null = null

// The texture video is fetched through the asset loader so its download
// counts toward the preloader's percentage.
onMounted(() => {
  const el = texVideo.value
  if (!el) return
  const ext = el.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4'
  assetLoader.add(
    'signal-video',
    async (report) => {
      objectUrl = await fetchWithProgress(`${s.video.src}.${ext}`, report)
      el.src = objectUrl
    },
    2,
  )
})
onBeforeUnmount(() => objectUrl && URL.revokeObjectURL(objectUrl))

// Only decode video frames while the card is on screen.
useScrollTrigger(() => {
  if (!card.value) return
  ScrollTrigger.create({
    trigger: card.value,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: ({ isActive }) => {
      const el = texVideo.value
      if (!el) return
      isActive ? el.play().catch(() => {}) : el.pause()
    },
  })
})

const material = (stage: Stage) => createVideoMaterial(stage.shared, texVideo.value!)
const openPlayer = () => (video.value = { src: s.video.src, title: s.video.title })
</script>

<template>
  <section id="signal" class="signal section" aria-labelledby="signal-title">
    <div class="signal__head">
      <HackyText tag="p" class="eyebrow">{{ s.eyebrow }}</HackyText>
      <RevealMask>
        <h2 id="signal-title" class="type-title">{{ s.title }}</h2>
      </RevealMask>
      <p class="signal__body">{{ s.body }}</p>
    </div>

    <video ref="texVideo" class="signal__texture" muted loop playsinline preload="auto" aria-hidden="true" />

    <HoverSfx :external-hover="hovering" />
    <button ref="card" type="button" class="signal__card" :aria-label="`Play ${s.video.title}`" @click="openPlayer">
      <GlPlane class="signal__plane" :material="material" :hover="hovering">
        <img class="signal__poster" :src="`${s.video.src}-poster.jpg`" alt="" />
      </GlPlane>
      <span class="signal__play type-mono" :class="{ 'is-hover': hovering }">
        <span class="signal__icon" aria-hidden="true">▶</span> Play transmission
      </span>
      <span class="signal__meta type-mono">
        <span>{{ s.video.title }}</span>
        <span>{{ s.video.duration }}</span>
      </span>
    </button>
  </section>
</template>

<style scoped>
.signal__head {
  display: grid;
  gap: 18px;
  max-width: 900px;
  margin-bottom: 56px;
}

.signal__body {
  margin: 0;
  color: var(--dim);
  max-width: 44ch;
}

.signal__texture {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.signal__card {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px));
}

.signal__plane {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.signal__poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.signal__play {
  position: absolute;
  left: 50%;
  top: 50%;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-radius: 999px;
  border: 1px solid var(--bone);
  background: rgb(7 9 12 / 0.5);
  backdrop-filter: blur(4px);
  transform: translate(-50%, -50%);
  transition: transform 0.5s var(--ease-out), background 0.3s, color 0.3s;
}

.signal__play.is-hover {
  transform: translate(-50%, -50%) scale(1.08);
  background: var(--bone);
  color: var(--ink);
}

.signal__meta {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 14px;
  display: flex;
  justify-content: space-between;
  color: var(--dim);
}
</style>
