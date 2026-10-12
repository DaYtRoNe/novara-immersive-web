<script setup lang="ts">
import { gsap } from 'gsap'

/**
 * Sound toggle drawn as a tiny equaliser. Each bar loops a short tween whose
 * target height is re-rolled every repeat (repeatRefresh), so it never loops
 * visibly. Muted, the bars settle flat.
 */
const props = withDefaults(defineProps<{ interactive?: boolean; bars?: number }>(), { interactive: true, bars: 5 })

const { isMuted } = useAppState()
const root = ref<HTMLElement | null>(null)
let tweens: gsap.core.Tween[] = []

onMounted(() => {
  const bars = root.value?.querySelectorAll<HTMLElement>('.bar') ?? []
  tweens = [...bars].map((bar) =>
    gsap.to(bar, {
      scaleY: () => (isMuted.value ? 0.18 : 0.25 + Math.random() * 0.75),
      duration: () => 0.16 + Math.random() * 0.12,
      ease: 'sine.inOut',
      repeat: -1,
      repeatRefresh: true,
    }),
  )
})
onBeforeUnmount(() => tweens.forEach((t) => t.kill()))

const toggle = () => {
  if (props.interactive) isMuted.value = !isMuted.value
}
</script>

<template>
  <button
    ref="root"
    class="btn-audio"
    type="button"
    :aria-pressed="!isMuted"
    :aria-label="isMuted ? 'Turn sound on' : 'Turn sound off'"
    :tabindex="interactive ? 0 : -1"
    @click="toggle"
  >
    <span v-for="i in bars" :key="i" class="bar" />
  </button>
</template>

<style scoped>
.btn-audio {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 18px;
  padding: 4px;
}

.bar {
  width: 2px;
  height: 100%;
  background: currentColor;
  transform: scaleY(0.18);
  transform-origin: 50% 50%;
}
</style>
