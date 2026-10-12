<script setup lang="ts">
import { stageRegistry } from '~/lib/gl/Stage'
import { site } from '~/content/site'

useHead({ title: `${site.name} — ${site.tagline}` })

const { consumePendingHash } = useSiteNav()
const { pageReady } = useAppState()
watch(pageReady, (r) => r && consumePendingHash())

/** Tints per section, as [r, g, b] in 0..1. */
const TINT = {
  signal: { tintR: 1, tintG: 0.35, tintB: 0.12 },
  cyan: { tintR: 0.36, tintG: 0.95, tintB: 1 },
  acid: { tintR: 0.83, tintG: 1, tintB: 0.36 },
}

// The whole page as one scroll-pixel timeline (see useScrollStory).
useScrollStory((tl, { vh, top }) => {
  const stage = stageRegistry.get()
  const q = (s: string) => document.querySelector(s)

  // Hero lines drift apart as the hero scrolls away.
  const lines = document.querySelectorAll<HTMLElement>('[data-hero-line]')
  const drift = [-14, 10, -7]
  lines.forEach((line, i) => tl.fromTo(line, { xPercent: 0 }, { xPercent: drift[i], duration: vh }, 0))
  tl.fromTo('.hero__intro', { autoAlpha: 1 }, { autoAlpha: 0, duration: vh * 0.5 }, 0)

  if (!stage) return
  const s = stage.state
  const manifesto = top(q('#manifesto'))
  const factions = top(q('#factions'))
  const signal = top(q('#signal'))
  const outro = top(q('.outro'))

  tl.set(s, { formation: 0, cameraZ: 6, ...TINT.signal }, 0)
    // Into the manifesto: camera pushes in, colour cools.
    .to(s, { cameraZ: 4.6, ...TINT.cyan, duration: vh }, manifesto - vh)
    // Factions: the shards lock into a halo.
    .to(s, { formation: 1, cameraZ: 5.4, ...TINT.signal, duration: vh * 1.2 }, factions - vh)
    // Signal: the halo breaks, camera dives.
    .to(s, { formation: 0.15, cameraZ: 3.6, ...TINT.acid, duration: vh }, signal - vh)
    // Outro: everything re-forms.
    .to(s, { formation: 1, cameraZ: 6.5, ...TINT.signal, duration: vh }, outro - vh)
})
</script>

<template>
  <div class="page-home">
    <HeroSection />
    <ManifestoSection />
    <FactionsSection />
    <SignalSection />
    <OutroSection />
  </div>
</template>
