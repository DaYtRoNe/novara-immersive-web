<script setup lang="ts">
import { site } from '~/content/site'
import { cornerCutPolygon } from '~/lib/corner-cut'

const o = site.outro
const { go } = useSiteNav()
const clip = cornerCutPolygon(['tr', 'bl'], '14px')
</script>

<template>
  <section class="outro section" aria-labelledby="outro-title">
    <RevealMask>
      <h2 id="outro-title" class="outro__title type-display">
        <HackyText :speed="1.4">{{ o.title }}</HackyText>
      </h2>
    </RevealMask>
    <HoverSfx>
      <a :href="o.to" class="outro__cta type-mono" :style="{ clipPath: clip }" @click.prevent="go(o.to)">
        <HackyText trigger="none" :hover="true">{{ o.cta }}</HackyText>
        <span aria-hidden="true">→</span>
      </a>
    </HoverSfx>
  </section>
</template>

<style scoped>
.outro {
  min-height: 90vh;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 48px;
}

.outro__title {
  margin: 0;
  font-size: clamp(3.6rem, 12vw, 13rem);
}

.outro__cta {
  display: inline-flex;
  gap: 18px;
  padding: 18px 28px;
  background: var(--signal);
  color: var(--ink);
  font-weight: 600;
  transition: background 0.25s;
}

.outro__cta:hover {
  background: var(--bone);
}
</style>
