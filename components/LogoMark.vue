<script setup lang="ts">
import { gsap } from 'gsap'

/**
 * The NOVARA "Beacon" mark: the relay mast, its broken signal ring and the
 * core. Geometry matches brand/svg/symbol-beacon.svg (see brand/build-logo.mjs).
 * Colour follows CSS `color`.
 *
 * motion: 'none' | 'spin' (ring rotates, for loaders) | 'pulse' (core breathes)
 * Call `play()` for the draw-in intro.
 */
withDefaults(defineProps<{ motion?: 'none' | 'spin' | 'pulse'; title?: string }>(), { motion: 'none', title: undefined })

const root = ref<SVGSVGElement | null>(null)

/** Draw-in: mast grows from the centre, ring segments swing in, core pops. */
function play({ delay = 0 } = {}) {
  const q = gsap.utils.selector(root)
  return gsap
    .timeline({ delay })
    .fromTo(q('.mast'), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'expo.out' }, 0)
    .fromTo(q('.seg'), { rotate: -90, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.15)
    .fromTo(q('.core'), { scale: 0 }, { scale: 1, duration: 0.7, ease: 'back.out(2.5)' }, 0.35)
}

defineExpose({ play })
</script>

<template>
  <svg
    ref="root"
    class="logo-mark"
    :class="`is-${motion}`"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    :role="title ? 'img' : undefined"
    :aria-label="title"
    :aria-hidden="title ? undefined : 'true'"
  >
    <path class="mast" d="M60 2L60 118" stroke-width="4.5" />
    <g class="ring" stroke-width="10">
      <path class="seg" d="M53.05 20.61A40 40 0 0 0 21.36 49.65" />
      <path class="seg" d="M20 60A40 40 0 0 0 53.05 99.39" />
      <path class="seg" d="M66.95 99.39A40 40 0 0 0 98.64 70.35" />
      <path class="seg" d="M100 60A40 40 0 0 0 66.95 20.61" />
    </g>
    <circle class="core" cx="60" cy="60" r="17" fill="currentColor" stroke="none" />
  </svg>
</template>

<style scoped>
.logo-mark {
  display: block;
  overflow: visible;
}

.mast,
.seg,
.ring,
.core {
  transform-box: view-box;
  transform-origin: 60px 60px;
}

.is-spin .ring {
  animation: logo-spin 1.4s linear infinite;
}

.is-pulse .core {
  animation: logo-pulse 1.6s ease-in-out infinite;
}

.is-pulse .ring {
  animation: logo-spin 6s linear infinite;
}

@keyframes logo-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes logo-pulse {
  50% {
    transform: scale(0.72);
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .core {
    animation: none !important;
  }
}
</style>
