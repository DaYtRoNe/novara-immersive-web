<script setup lang="ts">
import { gsap } from 'gsap'
import { registerWipe } from '~/composables/usePageWipe'

/** Panel that covers the screen between pages. */
const root = ref<HTMLElement | null>(null)

const FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
const BELOW = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)'
const ABOVE = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'

onMounted(() => {
  registerWipe({
    async cover() {
      await gsap
        .timeline()
        .set(root.value, { display: 'grid', clipPath: BELOW })
        .to(root.value, { clipPath: FULL, duration: 0.7, ease: 'expo.inOut' })
        .fromTo('.wipe__inner', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, '-=0.25')
    },
    async uncover() {
      await gsap
        .timeline()
        .to('.wipe__inner', { autoAlpha: 0, y: -20, duration: 0.3, ease: 'power2.in' })
        .to(root.value, { clipPath: ABOVE, duration: 0.8, ease: 'expo.inOut' }, '-=0.1')
        .set(root.value, { display: 'none' })
    },
  })
})
</script>

<template>
  <div ref="root" class="wipe" aria-hidden="true">
    <div class="wipe__inner">
      <LogoMark class="wipe__mark" motion="spin" />
      <span class="type-mono">// Tuning signal</span>
    </div>
  </div>
</template>

<style scoped>
.wipe {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: none;
  place-items: center;
  background: var(--signal);
  color: var(--ink);
}

.wipe__inner {
  display: grid;
  justify-items: center;
  gap: 14px;
}

/* Only the signal ring spins (LogoMark motion="spin"); the mast stays upright. */
.wipe__mark {
  width: 40px;
}
</style>
