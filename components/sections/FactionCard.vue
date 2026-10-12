<script setup lang="ts">
import type { Faction } from '~/content/site'
import { createSigilMaterial } from '~/lib/gl/materials'
import type { Stage } from '~/lib/gl/Stage'

const props = defineProps<{ faction: Faction }>()

const root = ref<HTMLElement | null>(null)
const hovering = useHover(root)
const material = (stage: Stage) => createSigilMaterial(stage.shared, props.faction.tint, props.faction.seed)
const fallbackTint = computed(() => props.faction.tint.map((c) => Math.round(c * 255)).join(' '))
</script>

<template>
  <article ref="root" class="card" tabindex="0" :style="{ '--tint': fallbackTint }">
    <HoverSfx :external-hover="hovering" leave="hoverOut" />
    <GlPlane class="card__art" :material="material" :hover="hovering">
      <div class="card__fallback" />
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

.card__fallback {
  width: 100%;
  height: 100%;
  background:
    repeating-radial-gradient(circle at 50% 50%, rgb(var(--tint) / 0.5) 0 1px, transparent 1px 34px),
    radial-gradient(circle at 50% 50%, rgb(var(--tint) / 0.25), transparent 70%),
    var(--ink-2);
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
