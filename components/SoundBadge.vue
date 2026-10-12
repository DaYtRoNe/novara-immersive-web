<script setup lang="ts">
import { gsap } from 'gsap'

/**
 * The "enable sound" badge shown on the loading screen: a sonar beacon with
 * rotating ring text, outward pings and an equaliser core. When sound turns
 * on it fires a shockwave and switches to the signal colour.
 */
const props = defineProps<{ soundOn: boolean }>()

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ringText = computed(() =>
  props.soundOn ? 'SOUND ON · SIGNAL LOCKED · SOUND ON · SIGNAL LOCKED · ' : 'CLICK ANYWHERE · ENABLE SOUND · CLICK ANYWHERE · ENABLE SOUND · ',
)

const shock = ref<HTMLElement | null>(null)

watch(
  () => props.soundOn,
  (on) => {
    if (!on || !shock.value) return
    gsap.fromTo(shock.value, { scale: 0.4, opacity: 1 }, { scale: 2.6, opacity: 0, duration: 0.9, ease: 'expo.out' })
  },
)
</script>

<template>
  <div class="badge" :class="{ 'is-on': soundOn }">
    <span class="badge__ping" />
    <span class="badge__ping badge__ping--late" />
    <span ref="shock" class="badge__shock" />

    <svg class="badge__ring" viewBox="0 0 140 140" aria-hidden="true">
      <defs>
        <path id="badge-circle" :d="`M70 ${70 - RADIUS}a${RADIUS} ${RADIUS} 0 1 1 0 ${RADIUS * 2}a${RADIUS} ${RADIUS} 0 1 1 0 -${RADIUS * 2}`" />
      </defs>
      <circle class="badge__track" cx="70" cy="70" r="64" />
      <text class="badge__text">
        <textPath href="#badge-circle" :textLength="CIRCUMFERENCE - 2" lengthAdjust="spacing">{{ ringText }}</textPath>
      </text>
    </svg>

    <span class="badge__core">
      <BtnAudio :interactive="false" :bars="5" />
    </span>
  </div>
</template>

<style scoped>
.badge {
  --tone: var(--bone);
  position: relative;
  width: 140px;
  height: 140px;
  display: grid;
  place-items: center;
  color: var(--tone);
  transition: color 0.4s;
}

.badge.is-on {
  --tone: var(--signal);
}

/* Rotating ring text */
.badge__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  animation: badge-spin 12s linear infinite;
}

.is-on .badge__ring {
  animation-duration: 5s;
}

.badge__track {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  stroke-dasharray: 2 6;
  opacity: 0.45;
}

.badge__text {
  fill: currentColor;
  font-family: var(--font-mono);
  font-size: 8.6px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

/* Centre disc with the equaliser */
.badge__core {
  position: relative;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--tone);
  color: var(--ink);
  box-shadow: 0 0 0 6px rgb(7 9 12 / 0.65), 0 0 28px color-mix(in srgb, var(--tone) 45%, transparent);
  transition: background 0.4s, box-shadow 0.4s;
}

.badge__core :deep(.btn-audio) {
  height: 20px;
  gap: 3px;
}

.badge__core :deep(.bar) {
  width: 3px;
}

/* Sonar pings travelling outward */
.badge__ping,
.badge__shock {
  position: absolute;
  inset: 42px;
  border-radius: 50%;
  border: 1px solid currentColor;
  pointer-events: none;
}

.badge__ping {
  animation: badge-ping 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}

.badge__ping--late {
  animation-delay: 1.2s;
}

.is-on .badge__ping {
  animation-duration: 1.4s;
}

.badge__shock {
  border-width: 2px;
  opacity: 0;
}

@keyframes badge-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes badge-ping {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge__ring,
  .badge__ping {
    animation: none;
  }
}
</style>
