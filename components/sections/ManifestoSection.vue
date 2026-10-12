<script setup lang="ts">
import { site } from '~/content/site'

const m = site.manifesto
</script>

<template>
  <section id="manifesto" class="manifesto section" aria-labelledby="manifesto-title">
    <HackyText tag="p" class="eyebrow">{{ m.eyebrow }}</HackyText>

    <RevealMask>
      <h2 id="manifesto-title" class="type-title manifesto__title">{{ m.title }}</h2>
    </RevealMask>

    <div class="manifesto__grid">
      <RevealMask v-for="(p, i) in m.body" :key="i">
        <p class="manifesto__body">{{ p }}</p>
      </RevealMask>
    </div>

    <dl class="manifesto__stats">
      <RevealMask v-for="s in m.stats" :key="s.label" class="stat">
        <dt class="type-mono">{{ s.label }}</dt>
        <dd class="type-display">
          <HackyText :speed="1.6" :hover="true">{{ s.value }}</HackyText>
        </dd>
      </RevealMask>
    </dl>
  </section>
</template>

<style scoped>
.manifesto__title {
  max-width: 14ch;
  margin: 18px 0 64px;
}

.manifesto__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(24px, 4vw, 72px);
  max-width: 1100px;
  margin-left: auto;
}

.manifesto__body {
  margin: 0;
  color: var(--dim);
  font-size: 1.05rem;
}

.manifesto__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 96px 0 0;
  border-top: 1px solid var(--faint);
}

.stat {
  padding: 22px 0 0;
}

.stat dt {
  color: var(--dim);
}

.stat dd {
  margin: 10px 0 0;
  font-size: clamp(3rem, 7vw, 6.5rem);
}

@media (max-width: 767px) {
  .manifesto__grid,
  .manifesto__stats {
    grid-template-columns: 1fr;
  }
}
</style>
