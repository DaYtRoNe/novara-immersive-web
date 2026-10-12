<script setup lang="ts">
import { gsap } from 'gsap'

/**
 * Wipes its content up into view when it scrolls into the viewport.
 *
 * Time-based (plays once, ~0.9s) rather than scrubbed to scroll, so the
 * content never sits half-revealed with letters sliced through when the
 * visitor stops scrolling mid-way.
 */
withDefaults(defineProps<{ tag?: string }>(), { tag: 'div' })

const root = ref<HTMLElement | null>(null)
const inner = ref<HTMLElement | null>(null)

useScrollTrigger(() => {
  if (!root.value || !inner.value) return
  gsap
    .timeline({ scrollTrigger: { trigger: root.value, start: 'top 88%', once: true } })
    .fromTo(root.value, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out' })
    .fromTo(inner.value, { yPercent: 30 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 0)
    // Drop the clip once done so descenders/ascenders are never trimmed.
    .set(root.value, { clearProps: 'clipPath' })
}, root)
</script>

<template>
  <component :is="tag" ref="root" class="reveal-mask">
    <div ref="inner" class="reveal-mask__inner"><slot /></div>
  </component>
</template>
