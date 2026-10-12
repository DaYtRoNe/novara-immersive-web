<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { device } from '~/lib/device'
import { playSound } from '~/lib/audio'

/**
 * Text that "decodes" itself: characters type in, show as random glyphs,
 * then resolve left-to-right into the real text.
 *
 * The real text always stays in the DOM (for layout and screen readers);
 * the scrambled copy is drawn on top in an aria-hidden layer.
 */
const props = withDefaults(
  defineProps<{
    /** 'scroll': play when scrolled into view. 'manual': call play(). 'none': static. */
    trigger?: 'scroll' | 'manual' | 'none'
    once?: boolean
    /** Re-scramble when hovered. */
    hover?: boolean
    /** Drive hover from a parent instead of this element. */
    externalHover?: boolean
    delay?: number
    /** Multiplier on duration (lower = faster). */
    speed?: number
    sound?: boolean
    tag?: string
  }>(),
  { trigger: 'scroll', once: true, hover: false, externalHover: undefined, delay: 0, speed: 1, sound: false, tag: 'span' },
)

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>=+*'
const SECONDS_PER_CHAR = 0.028

const { entered } = useAppState()
const root = ref<HTMLElement | null>(null)
const source = ref<HTMLElement | null>(null)
const output = ref<HTMLElement | null>(null)
const animating = ref(false)
const revealed = ref(props.trigger === 'none')

const state = { typed: 0, resolved: 0 }
let text = ''
let timeline: gsap.core.Timeline | null = null
let pendingPlay = false

function render() {
  if (!output.value) return
  const typed = Math.min(Math.floor(state.typed), text.length)
  const resolved = Math.floor(state.resolved)
  let out = ''
  for (let i = 0; i < typed; i++) {
    const ch = text[i]
    const keep = i < resolved || ch === ' ' || ch === '\n'
    out += keep ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
  }
  output.value.textContent = out
}

function finish() {
  animating.value = false
  if (output.value) output.value.textContent = ''
}

/**
 * @param typeIn  also animate characters appearing (false = scramble in place)
 */
function play({ delay = 0, speed = props.speed, typeIn = true } = {}) {
  revealed.value = true
  if (!source.value || device.reducedMotion) return
  text = source.value.innerText
  const n = text.length
  if (!n) return

  timeline?.kill()
  animating.value = true
  state.typed = typeIn ? 0 : n
  state.resolved = 0

  timeline = gsap.timeline({ delay: delay + props.delay, onUpdate: render, onComplete: finish })
  if (typeIn) timeline.to(state, { typed: n, duration: SECONDS_PER_CHAR * n * speed, ease: 'none' }, 0)
  timeline.to(state, { resolved: n, duration: (SECONDS_PER_CHAR * n + 0.35) * speed, ease: 'none' }, 0)
  if (props.sound) timeline.call(() => playSound('decode', { throttleMs: 150 }), undefined, 0)
}

/** Hide the text again (e.g. before a menu re-opens). */
function hide() {
  timeline?.kill()
  finish()
  revealed.value = false
}

// Scroll trigger: wait until the visitor has entered the site, so text
// under the preloader doesn't animate unseen.
useScrollTrigger(() => {
  if (props.trigger !== 'scroll' || !root.value) return
  ScrollTrigger.create({
    trigger: root.value,
    start: 'top 92%',
    once: props.once,
    onEnter: () => (entered.value ? play() : (pendingPlay = true)),
  })
})
watch(entered, (v) => {
  if (v && pendingPlay) {
    pendingPlay = false
    play({ delay: 0.3 })
  }
})

const selfHover = useHover(root)
const isHovering = computed(() => props.externalHover ?? (props.hover && selfHover.value))
watch(isHovering, (h) => {
  if (h && !animating.value && revealed.value) play({ typeIn: false, speed: 0.7 })
})

onBeforeUnmount(() => timeline?.kill())

defineExpose({ play, hide })
</script>

<template>
  <component :is="tag" ref="root" class="hacky" :class="{ 'is-hidden': !revealed, 'is-animating': animating }">
    <span ref="source" class="hacky__source"><slot /></span>
    <span ref="output" class="hacky__output" aria-hidden="true" />
  </component>
</template>

<style scoped>
.hacky {
  position: relative;
  display: inline-block;
}

.hacky__source {
  display: inline;
  transition: color 0s;
}

.is-hidden .hacky__source,
.is-animating .hacky__source {
  color: transparent;
}

.hacky__output {
  position: absolute;
  inset: 0;
  white-space: pre-wrap;
  pointer-events: none;
}
</style>
