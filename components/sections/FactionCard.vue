<script setup lang="ts">
import { gsap } from 'gsap'
import type { Faction } from '~/content/site'
import { createVideoMaterial } from '~/lib/gl/materials'
import type { Stage } from '~/lib/gl/Stage'

const props = defineProps<{ faction: Faction }>()

/** Playback speed while hovered: the scene "wakes up". */
const HOVER_RATE = 1.6

const root = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const hovering = useHover(root)
// Artwork, not a raw feed: full brightness and sharp at rest, faint scanlines.
const material = (stage: Stage) =>
  createVideoMaterial(stage.shared, video.value!, { idleBrightness: 0.92, idleSplit: 0, scanlines: 0.05 })
const fallbackTint = computed(() => props.faction.tint.map((c) => Math.round(c * 255)).join(' '))
const poster = computed(() => `${props.faction.video}-poster.jpg`)

// Loaded as the section approaches (not in the preloader), played while visible.
useLazyVideo(video, root, () => props.faction.video)

// Ease the playback rate rather than jumping it.
watch(hovering, (h) => {
  if (video.value) gsap.to(video.value, { playbackRate: h ? HOVER_RATE : 1, duration: 0.6, ease: 'power2.out' })
})
</script>

<template>
  <article ref="root" class="card" tabindex="0" :style="{ '--tint': fallbackTint }">
    <HoverSfx :external-hover="hovering" leave="hoverOut" />
    <video ref="video" class="card__texture" muted loop playsinline preload="auto" aria-hidden="true" />
    <GlPlane class="card__art" :material="material" :hover="hovering">
      <img class="card__fallback" :src="poster" alt="" loading="lazy" />
    </GlPlane>
    <header class="card__head type-mono">
      <span>{{ faction.code }}</span>
      <span class="card__arrow" aria-hidden="true">↗</span>
    </header>
    <h3 class="card__name">
      <HackyText :external-hover="hovering">{{ faction.name }}</HackyText>
    </h3>
    <p class="card__blurb">{{ faction.blurb }}</p>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--faint);
  background: rgb(7 9 12 / 0.35);
  backdrop-filter: blur(2px);
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
  transition: border-color 0.3s, background 0.3s;
  outline-offset: -4px;
}

.card:hover,
.card:focus-visible {
  border-color: rgb(var(--tint));
  background: rgb(7 9 12 / 0.6);
}

.card__art {
  aspect-ratio: 4 / 5;
  width: 100%;
  min-width: 0;
  align-self: start;
}

/* Poster shown only when WebGL isn't available. */
.card__fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--ink-2);
}

/* Off-screen source for the WebGL video texture. */
.card__texture {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.card__head {
  display: flex;
  justify-content: space-between;
  color: rgb(var(--tint));
}

.card__arrow {
  transition: transform 0.4s var(--ease-out);
}

.card:hover .card__arrow {
  transform: translate(3px, -3px);
}

.card__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-variation-settings: 'wdth' 85;
  text-transform: uppercase;
  font-size: clamp(1.6rem, 2.4vw, 2.3rem);
  line-height: 0.95;
}

.card__blurb {
  margin: 0 0 6px;
  color: var(--dim);
  font-size: 0.95rem;
}
</style>
