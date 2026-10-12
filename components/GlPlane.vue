<script setup lang="ts">
import { gsap } from 'gsap'
import type { ShaderMaterial } from 'three'
import { DomPlane } from '~/lib/gl/DomPlane'
import { stageRegistry, type Stage } from '~/lib/gl/Stage'

/**
 * A box in the page layout that WebGL draws into. The slot is the non-WebGL
 * fallback (and is hidden once the GL plane is active). The plane reveals
 * with a scrubbed wipe as the box scrolls into view.
 */
const props = withDefaults(
  defineProps<{
    material: (stage: Stage) => ShaderMaterial
    hover?: boolean
  }>(),
  { hover: false },
)

const el = ref<HTMLElement | null>(null)
const active = ref(false)
let plane: DomPlane | null = null

onMounted(() => {
  const stage = stageRegistry.get()
  if (!stage || !el.value) return
  plane = new DomPlane({ el: el.value, material: props.material(stage) })
  stage.addPlane(plane)
  active.value = true
})

useScrollTrigger(() => {
  if (!plane || !el.value) return
  const target = plane
  gsap.fromTo(
    target,
    { reveal: 0 },
    {
      reveal: 1,
      ease: 'none',
      scrollTrigger: { trigger: el.value, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    },
  )
})

watch(
  () => props.hover,
  (h) => plane && (plane.hover.target = h ? 1 : 0),
)

onBeforeUnmount(() => {
  if (plane) stageRegistry.get()?.removePlane(plane)
  plane = null
})
</script>

<template>
  <div ref="el" class="gl-plane" :class="{ 'is-active': active }">
    <div class="gl-plane__fallback"><slot /></div>
  </div>
</template>

<style scoped>
.gl-plane {
  position: relative;
}

.gl-plane.is-active .gl-plane__fallback {
  visibility: hidden;
}

.gl-plane__fallback {
  position: absolute;
  inset: 0;
}
</style>
