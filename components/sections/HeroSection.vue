<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'
import type HackyText from '../HackyText.vue'

const { entered, pageReady } = useAppState()
const root = ref<HTMLElement | null>(null)
const lines = ref<InstanceType<typeof HackyText>[]>([])

// Headline decodes in once the visitor is in and the page is settled.
const start = () => {
  lines.value.forEach((line, i) => line.play({ delay: 0.9 + i * 0.28, speed: 1.3 }))
  gsap.fromTo(
    root.value?.querySelectorAll('[data-hero-fade]') ?? [],
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, delay: 1.4 },
  )
}
watch(
  () => entered.value && pageReady.value,
  (ready, was) => ready && !was && start(),
)
onMounted(() => entered.value && pageReady.value && start())

defineExpose({ root })
</script>

<template>
  <section ref="root" class="hero" aria-labelledby="hero-title">
    <p class="hero__intro type-lead" data-hero-fade>{{ site.hero.intro }}</p>

    <h1 id="hero-title" class="hero__title type-display">
      <span v-for="(line, i) in site.hero.lines" :key="line.index" class="hero__line" :class="`hero__line--${i}`" data-hero-line>
        <span class="hero__index type-mono" data-hero-fade>{{ line.index }}</span>
        <HackyText ref="lines" trigger="manual">{{ line.text }}</HackyText>
      </span>
    </h1>

    <div class="hero__meta type-mono" data-hero-fade>
      <span>{{ site.name }} / {{ site.tagline }}</span>
      <span>Pulse every 11:00</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  padding: calc(var(--frame) + var(--bar) + 6vh) calc(var(--frame) + var(--gutter)) 8vh calc(var(--frame) + var(--rail) + var(--gutter));
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.hero__intro {
  margin: 0;
  max-width: 30ch;
}

.hero__title {
  align-self: end;
  margin: 0;
  /* Width-driven, but capped by height so three lines always fit. */
  font-size: clamp(3.4rem, min(15.5vw, 23svh), 17rem);
  display: grid;
}

.hero__line {
  position: relative;
  display: block;
  white-space: nowrap;
  will-change: transform;
}

.hero__line--0 {
  padding-left: 30%;
}

.hero__line--1 {
  padding-left: 46%;
  color: var(--signal);
}

.hero__line--2 {
  padding-left: 4%;
}

.hero__index {
  position: absolute;
  top: 0.4em;
  font-size: max(0.7rem, 0.06em);
  letter-spacing: 0.1em;
  color: var(--bone);
  transform: translateX(-130%);
}

.hero__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4vh;
  color: var(--dim);
}

@media (max-width: 767px) {
  .hero__title {
    font-size: clamp(3.4rem, 20vw, 7rem);
  }
  .hero__line--0 {
    padding-left: 10%;
  }
  .hero__line--1 {
    padding-left: 22%;
  }
  .hero__line--2 {
    padding-left: 0;
  }
  .hero__index {
    display: none;
  }
  .hero__meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
