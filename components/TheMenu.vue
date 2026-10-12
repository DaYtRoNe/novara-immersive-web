<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'
import { playSound } from '~/lib/audio'
import { scroll } from '~/lib/scroll'
import type MenuNavItem from './MenuNavItem.vue'

const { menuOpen } = useAppState()
const { go, isActive } = useSiteNav()
const route = useRoute()

const root = ref<HTMLElement | null>(null)
const items = ref<InstanceType<typeof MenuNavItem>[]>([])
const clock = ref('')

/** Fraction of the sequence spent on the accent bars before panels move. */
const BAR_SPLIT = 0.35

let sequence: gsap.core.Timeline | null = null
let transition: gsap.core.Timeline | null = null

/**
 * The menu choreography as one linear, paused timeline (0 → 1):
 * accent bars sweep across, then both panels slide in.
 * Open/close tween its `progress` with an ease, so the whole multi-step
 * move accelerates and settles as a single gesture.
 */
function buildSequence() {
  const q = gsap.utils.selector(root)
  sequence?.kill()
  sequence = gsap
    .timeline({ paused: true, defaults: { ease: 'none' } })
    .fromTo(q('.menu__bar--a'), { scaleX: 0 }, { scaleX: 1, duration: BAR_SPLIT }, 0)
    .fromTo(q('.menu__bar--b'), { scaleX: 0 }, { scaleX: 1, duration: BAR_SPLIT }, 0.05)
    .fromTo(q('.menu__panel--left'), { xPercent: -100 }, { xPercent: 0, duration: 1 - BAR_SPLIT }, BAR_SPLIT)
    .fromTo(q('.menu__panel--right'), { xPercent: 100 }, { xPercent: 0, duration: 1 - BAR_SPLIT }, BAR_SPLIT)
    .to(q('.menu__bar'), { autoAlpha: 0, duration: 0.15 }, 0.85)
}

function open() {
  if (!root.value) return
  buildSequence()
  const q = gsap.utils.selector(root)
  scroll.setPaused(true)
  document.body.classList.add('is-locked')
  playSound('menuOpen', { throttleMs: 0 })
  items.value.forEach((i) => i.reset())

  transition?.kill()
  transition = gsap
    .timeline()
    .set(root.value, { display: 'block' })
    .fromTo(q('.menu__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' }, 0)
    .fromTo(sequence, { progress: 0 }, { progress: 1, duration: 0.85, ease: 'power3.inOut' }, 0)
    .fromTo(q('.menu-item'), { x: -120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: 'expo.out' }, 0.45)
    .fromTo(q('[data-menu-reveal]'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05 }, 0.6)
    .call(() => items.value.forEach((item, i) => item.animateIn(i * 0.12)), undefined, 0.5)
    .call(() => root.value?.querySelector<HTMLElement>('.menu-item__link')?.focus({ preventScroll: true }))
}

function close() {
  if (!root.value || !sequence) return
  const q = gsap.utils.selector(root)
  playSound('menuClose', { throttleMs: 0 })

  transition?.kill()
  transition = gsap
    .timeline({
      onComplete: () => {
        gsap.set(root.value, { display: 'none' })
        scroll.setPaused(false)
        document.body.classList.remove('is-locked')
      },
    })
    .to(q('.menu-item, [data-menu-reveal]'), { autoAlpha: 0, x: 40, duration: 0.25, stagger: 0.02, ease: 'power2.in' }, 0)
    .to(sequence, { progress: 0, duration: 0.55, ease: 'power3.inOut' }, 0.1)
    .to(q('.menu__backdrop'), { opacity: 0, duration: 0.3, ease: 'none' }, 0.35)
  document.querySelector<HTMLElement>('.btn-burger')?.focus({ preventScroll: true })
}

watch(menuOpen, (v) => (v ? open() : close()))
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)

const onSelect = async (to: string) => {
  menuOpen.value = false
  await new Promise((r) => setTimeout(r, 450))
  go(to)
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && menuOpen.value) menuOpen.value = false
}

// A live "relay clock" for the info panel.
let clockTimer: ReturnType<typeof setInterval> | undefined
const updateClock = () => (clock.value = new Date().toISOString().slice(11, 19))

onMounted(() => {
  window.addEventListener('keydown', onKey)
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(clockTimer)
  transition?.kill()
  sequence?.kill()
})
</script>

<template>
  <div id="site-menu" ref="root" class="menu" role="dialog" aria-modal="true" aria-label="Site menu" :aria-hidden="!menuOpen">
    <div class="menu__backdrop" @click="menuOpen = false" />
    <span class="menu__bar menu__bar--a" />
    <span class="menu__bar menu__bar--b" />

    <div class="menu__panel menu__panel--left">
      <p class="menu__eyebrow type-mono" data-menu-reveal>// Navigation</p>
      <ul class="menu__list">
        <MenuNavItem
          v-for="(item, i) in site.nav"
          :key="item.to"
          ref="items"
          :item="item"
          :index="i"
          :active="isActive(item.to)"
          @select="onSelect"
        />
      </ul>
    </div>

    <aside class="menu__panel menu__panel--right">
      <div class="menu__block" data-menu-reveal>
        <p class="type-mono menu__key">Relay status</p>
        <p class="menu__value"><span class="dot" /> Broadcasting</p>
      </div>
      <div class="menu__block" data-menu-reveal>
        <p class="type-mono menu__key">Relay time (UTC)</p>
        <p class="menu__value type-mono">{{ clock }}</p>
      </div>
      <div class="menu__block" data-menu-reveal>
        <p class="type-mono menu__key">Elsewhere</p>
        <ul class="menu__social">
          <li v-for="l in site.footer.links" :key="l.label">
            <HoverSfx>
              <a :href="l.href" class="type-mono"><LinkHover>{{ l.label }}</LinkHover></a>
            </HoverSfx>
          </li>
        </ul>
      </div>
      <p class="menu__note" data-menu-reveal>{{ site.hero.intro }}</p>
    </aside>
  </div>
</template>

<style scoped>
.menu {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: none;
  overflow: hidden;
}

.menu__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(7 9 12 / 0.55);
  backdrop-filter: blur(6px);
}

.menu__bar {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--signal);
  transform-origin: 0 50%;
}
.menu__bar--a {
  top: 34%;
}
.menu__bar--b {
  top: 66%;
  background: var(--cyan);
  transform-origin: 100% 50%;
}

.menu__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--ink-2);
}

.menu__panel--left {
  left: 0;
  width: 66%;
  padding: calc(var(--frame) + var(--bar) + 6vh) 4vw 6vh calc(var(--frame) + var(--rail) + 4vw);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid var(--faint);
}

.menu__panel--right {
  right: 0;
  width: 34%;
  padding: calc(var(--frame) + var(--bar) + 6vh) calc(var(--frame) + 4vw) 6vh 4vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 32px;
  background: #0a0e13;
}

.menu__eyebrow {
  color: var(--signal);
  margin: 0 0 16px 14px;
}

.menu__list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.menu__key {
  color: var(--dim);
  margin: 0 0 6px;
}

.menu__value {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--acid);
  box-shadow: 0 0 12px var(--acid);
  animation: blink 1.4s steps(2) infinite;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

.menu__social {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
  margin-left: -0.45em;
}

.menu__note {
  margin: 0;
  color: var(--dim);
  max-width: 34ch;
  font-size: 0.95rem;
}

@media (max-width: 767px) {
  .menu__panel--left {
    width: 100%;
    padding-left: calc(var(--frame) + 4vw);
    border-right: 0;
  }
  .menu__panel--right {
    display: none;
  }
}
</style>
