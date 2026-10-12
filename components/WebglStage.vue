<script setup lang="ts">
import { gsap } from 'gsap'
import { stageRegistry } from '~/lib/gl/Stage'
import { assetLoader } from '~/lib/loader'
import { device } from '~/lib/device'

/** Mounts the single fixed WebGL canvas behind the page. */
const container = ref<HTMLElement | null>(null)
const { entered } = useAppState()
const supported = ref(true)

onMounted(() => {
  supported.value = device.webgl
  if (!supported.value || !container.value) return
  const stage = stageRegistry.create(container.value)
  document.documentElement.classList.add('has-webgl')
  assetLoader.add(
    'shaders',
    async (report) => {
      stage.warmUp()
      report(1)
    },
    0.5,
  )
})

// Intro: the background iris opens and the shards fade in.
watch(entered, (v) => {
  const stage = stageRegistry.get()
  if (v && stage) gsap.to(stage.state, { intro: 1, duration: 2.4, ease: 'expo.out', delay: 0.2 })
})

onBeforeUnmount(() => stageRegistry.destroy())
</script>

<template>
  <div ref="container" class="webgl-stage" :class="{ 'is-fallback': !supported }" aria-hidden="true" />
</template>

<style scoped>
.webgl-stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.webgl-stage :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

/* No WebGL: a static gradient stands in for the shader background. */
.is-fallback {
  background:
    radial-gradient(60% 50% at 70% 30%, rgb(13 42 51 / 0.9), transparent 70%),
    radial-gradient(50% 40% at 20% 80%, rgb(255 90 31 / 0.18), transparent 70%),
    var(--ink);
}
</style>
