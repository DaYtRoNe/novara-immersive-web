<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'

const f = site.factions
const grid = ref<HTMLElement | null>(null)

// Cards rise in sequence as the grid enters.
useScrollTrigger(() => {
  if (!grid.value) return
  gsap.from(grid.value.children, {
    y: 120,
    autoAlpha: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'expo.out',
    scrollTrigger: { trigger: grid.value, start: 'top 85%' },
  })
}, grid)
</script>

<template>
  <section id="factions" class="factions section" aria-labelledby="factions-title">
    <div class="factions__head">
      <HackyText tag="p" class="eyebrow">{{ f.eyebrow }}</HackyText>
      <RevealMask>
        <h2 id="factions-title" class="type-title">{{ f.title }}</h2>
      </RevealMask>
    </div>
    <div ref="grid" class="factions__grid">
      <FactionCard v-for="item in f.items" :key="item.id" :faction="item" />
    </div>
  </section>
</template>

<style scoped>
.factions__head {
  display: grid;
  gap: 18px;
  margin-bottom: 64px;
}

.factions__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 28px);
  /* Don't stretch cards to a common height: the extra height would flow
     into the 4:5 art box and make it wider than the card. */
  align-items: start;
}

.factions__grid > :deep(*:nth-child(2)) {
  margin-top: 12vh;
}

.factions__grid > :deep(*:nth-child(3)) {
  margin-top: 24vh;
}

@media (max-width: 900px) {
  .factions__grid {
    grid-template-columns: 1fr;
  }
  .factions__grid > :deep(*) {
    margin-top: 0 !important;
  }
}
</style>
