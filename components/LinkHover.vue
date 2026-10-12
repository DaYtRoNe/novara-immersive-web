<script setup lang="ts">
import { gsap } from 'gsap'

/**
 * Hover highlight: a block slides in from the left behind the label and the
 * label inverts; on leave the block keeps travelling out to the right.
 */
const props = withDefaults(defineProps<{ externalHover?: boolean; disabled?: boolean }>(), {
  externalHover: undefined,
  disabled: false,
})

const root = ref<HTMLElement | null>(null)
const block = ref<HTMLElement | null>(null)
const selfHover = useHover(root)
const hovering = computed(() => !props.disabled && (props.externalHover ?? selfHover.value))

watch(hovering, (h) => {
  if (!block.value) return
  gsap.killTweensOf(block.value)
  // GSAP reads the CSS translateX(-101%) as a pixel `x` offset and would add
  // xPercent on top of it, so pin x to 0 and drive position by xPercent only.
  if (h) gsap.fromTo(block.value, { x: 0, xPercent: -101 }, { xPercent: 0, duration: 0.35, ease: 'power3.out' })
  else gsap.to(block.value, { x: 0, xPercent: 101, duration: 0.35, ease: 'power3.in' })
})
</script>

<template>
  <span ref="root" class="link-hover" :class="{ 'is-hover': hovering }">
    <span ref="block" class="link-hover__block" aria-hidden="true" />
    <span class="link-hover__label"><slot /></span>
  </span>
</template>

<style scoped>
.link-hover {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  padding: 0.2em 0.45em;
}

.link-hover__block {
  position: absolute;
  inset: 0;
  background: var(--bone);
  transform: translateX(-101%);
}

.link-hover__label {
  position: relative;
  transition: color 0.25s;
}

.is-hover .link-hover__label {
  color: var(--ink);
}
</style>
