<script setup lang="ts">
import { stageRegistry } from '~/lib/gl/Stage'
import { site } from '~/content/site'

const a = site.archive
useHead({ title: `${a.title} — ${site.name}` })

// A calmer scene for an inner page: shards form a halo, cyan light.
useScrollStory((tl, { vh }) => {
  const stage = stageRegistry.get()
  if (!stage) return
  tl.set(stage.state, { formation: 0.7, cameraZ: 7, tintR: 0.36, tintG: 0.95, tintB: 1 }, 0)
  tl.to(stage.state, { formation: 1, cameraZ: 5, duration: vh * 2 }, 0)
})

const hovered = ref<string | null>(null)
</script>

<template>
  <div class="page-archive section">
    <HackyText tag="p" class="eyebrow">{{ a.eyebrow }}</HackyText>
    <RevealMask>
      <h1 class="type-title archive__title">{{ a.title }}</h1>
    </RevealMask>

    <ol class="archive__list">
      <RevealMask v-for="log in a.logs" :key="log.id" tag="li" class="log">
        <HoverSfx :external-hover="hovered === log.id" />
        <article class="log__inner" tabindex="0" @pointerenter="hovered = log.id" @pointerleave="hovered = null" @focus="hovered = log.id" @blur="hovered = null">
          <span class="log__id type-mono">#{{ log.id }}</span>
          <h2 class="log__title">
            <HackyText :external-hover="hovered === log.id">{{ log.title }}</HackyText>
          </h2>
          <p class="log__body">{{ log.body }}</p>
          <span class="log__date type-mono">{{ log.date }}</span>
        </article>
      </RevealMask>
    </ol>
  </div>
</template>

<style scoped>
.page-archive {
  min-height: 100vh;
  padding-top: calc(var(--frame) + var(--bar) + 14vh);
}

.archive__title {
  margin: 18px 0 80px;
  font-size: clamp(3rem, 10vw, 9rem);
}

.archive__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--faint);
}

.log {
  border-bottom: 1px solid var(--faint);
}

.log__inner {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr) minmax(0, 1.3fr) auto;
  gap: 24px;
  align-items: baseline;
  padding: 28px 12px;
  transition: background 0.3s, color 0.3s;
}

.log__inner:hover,
.log__inner:focus-visible {
  background: var(--bone);
  color: var(--ink);
}

.log__id {
  color: var(--signal);
}

.log__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-variation-settings: 'wdth' 85;
  text-transform: uppercase;
  font-size: clamp(1.4rem, 2.6vw, 2.4rem);
  line-height: 1;
}

.log__body {
  margin: 0;
  color: inherit;
  opacity: 0.7;
}

.log__date {
  opacity: 0.6;
}

@media (max-width: 767px) {
  .log__inner {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
