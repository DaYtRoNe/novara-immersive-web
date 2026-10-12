<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~/content/site'
import { scroll } from '~/lib/scroll'
import { cornerCutPolygon } from '~/lib/corner-cut'

/**
 * The fixed UI chrome drawn over everything: border box, top bar with nav,
 * left rail with menu + sound buttons, scroll progress and hint.
 */
const { menuOpen, entered, scrollProgress } = useAppState()
const { go, isActive } = useSiteNav()

const root = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const mark = ref<{ play: (o?: { delay?: number }) => void } | null>(null)
const scrolled = ref(false)

const tabClip = cornerCutPolygon(['bl'], '14px')

useRaf(() => {
  const max = scroll.max()
  const p = max > 0 ? scroll.top() / max : 0
  scrollProgress.value = p
  if (progressEl.value) progressEl.value.style.transform = `scaleX(${p})`
  scrolled.value = scroll.top() > 40
})

const onNav = (to: string, e: MouseEvent) => {
  e.preventDefault()
  go(to)
}

// Entrance: border lines draw in, then controls fade up.
onMounted(() => {
  gsap.set('.frame__line', { scaleX: 0, scaleY: 0 })
  gsap.set('.frame [data-reveal]', { autoAlpha: 0, y: 10 })
})
watch(entered, (v) => {
  if (!v) return
  gsap
    .timeline({ delay: 0.5 })
    .to('.frame__line', { scaleX: 1, scaleY: 1, duration: 1.2, ease: 'expo.inOut', stagger: 0.08 })
    .to('.frame [data-reveal]', { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, '-=0.5')
    .call(() => mark.value?.play(), undefined, '<')
})
</script>

<template>
  <div ref="root" class="frame" :class="{ 'menu-open': menuOpen }">
    <!-- Border lines (separate elements so they can draw in). -->
    <span class="frame__line frame__line--top" />
    <span class="frame__line frame__line--bottom" />
    <span class="frame__line frame__line--left" />
    <span class="frame__line frame__line--right" />
    <span class="frame__line frame__line--bar" />
    <span class="frame__line frame__line--rail" />

    <!-- Rail (desktop) / corner (mobile): menu toggle -->
    <div class="frame__burger" data-reveal>
      <HoverSfx>
        <BtnBurger :open="menuOpen" @toggle="menuOpen = !menuOpen" />
      </HoverSfx>
    </div>

    <a href="/" class="frame__mark" aria-label="NOVARA home" data-reveal @click.prevent="go('/')">
      <LogoMark ref="mark" class="frame__logo" />
      <span class="frame__brand type-mono">{{ site.name }}</span>
    </a>

    <div class="frame__audio" data-reveal>
      <HoverSfx><BtnAudio /></HoverSfx>
    </div>

    <!-- Top nav (desktop) -->
    <nav class="frame__nav" aria-label="Primary">
      <HoverSfx v-for="item in site.nav" :key="item.to">
        <a
          :href="item.to"
          class="frame__link type-mono"
          :class="{ 'is-active': isActive(item.to) }"
          data-reveal
          @click="onNav(item.to, $event)"
        >
          <LinkHover>{{ item.label }}</LinkHover>
        </a>
      </HoverSfx>
    </nav>

    <HoverSfx>
      <a href="/#signal" class="frame__tab type-mono" :style="{ clipPath: tabClip }" data-reveal @click="onNav('/#signal', $event)">
        <HackyText trigger="none" :hover="true">Tune in</HackyText>
      </a>
    </HoverSfx>

    <!-- Scroll progress along the bar's bottom edge -->
    <span class="frame__progress"><span ref="progressEl" /></span>

    <div class="frame__hint type-mono" :class="{ 'is-hidden': scrolled }" data-reveal aria-hidden="true">
      Scroll
      <svg viewBox="0 0 12 8" width="12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1 1.5 6 6.5 11 1.5" /></svg>
    </div>
  </div>
</template>

<style scoped>
.frame {
  --line: var(--faint);
  position: fixed;
  inset: var(--frame);
  z-index: 50;
  pointer-events: none;
  color: var(--bone);
}

.frame > * {
  pointer-events: auto;
}

.frame__line,
.frame__progress {
  pointer-events: none !important;
}

/* ---- lines ---- */
.frame__line {
  position: absolute;
  background: var(--line);
}
.frame__line--top,
.frame__line--bottom,
.frame__line--bar {
  left: 0;
  right: 0;
  height: 1px;
  transform-origin: 0 50%;
}
.frame__line--top {
  top: 0;
}
.frame__line--bottom {
  bottom: 0;
  transform-origin: 100% 50%;
}
.frame__line--bar {
  top: var(--bar);
}
.frame__line--left,
.frame__line--right,
.frame__line--rail {
  top: 0;
  bottom: 0;
  width: 1px;
  transform-origin: 50% 0;
}
.frame__line--left {
  left: 0;
}
.frame__line--right {
  right: 0;
  transform-origin: 50% 100%;
}
.frame__line--rail {
  left: var(--rail);
}

/* ---- rail ---- */
.frame__burger {
  position: absolute;
  top: calc((var(--bar) - 40px) / 2);
  left: calc((var(--rail) - 40px) / 2);
}

.frame__mark {
  position: absolute;
  top: 50%;
  left: calc(var(--rail) / 2);
  transform: translate(-50%, -50%);
  display: grid;
  justify-items: center;
  gap: 10px;
  color: var(--bone);
  transition: color 0.3s;
}
.frame__mark svg {
  width: 28px;
}
.frame__mark:hover {
  color: var(--signal);
}
/* Hover: the signal ring turns a quarter, like a dial being tuned. */
.frame__mark :deep(.ring) {
  transition: transform 0.7s var(--ease-out);
}
.frame__mark:hover :deep(.ring) {
  transform: rotate(90deg);
}
.frame__brand {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.62rem;
  letter-spacing: 0.3em;
}

.frame__audio {
  position: absolute;
  bottom: 14px;
  left: calc(var(--rail) / 2);
  transform: translateX(-50%);
}

/* ---- top bar ---- */
.frame__nav {
  position: absolute;
  top: 0;
  left: 50%;
  height: var(--bar);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 28px);
}

.frame__link {
  font-size: 0.72rem;
  font-weight: 600;
}
.frame__link.is-active {
  color: var(--signal);
}

.frame__tab {
  position: absolute;
  top: 0;
  right: 0;
  height: var(--bar);
  display: flex;
  align-items: center;
  padding: 0 28px 0 34px;
  background: var(--bone);
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 600;
  transition: background 0.25s;
}
.frame__tab:hover {
  background: var(--signal);
}

.frame__progress {
  position: absolute;
  top: var(--bar);
  left: var(--rail);
  right: 0;
  height: 1px;
  overflow: hidden;
}
.frame__progress span {
  display: block;
  height: 100%;
  background: var(--signal);
  transform-origin: 0 50%;
  transform: scaleX(0);
}

.frame__hint {
  position: absolute;
  right: 26px;
  bottom: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.66rem;
  transition: opacity 0.5s;
}
.frame__hint svg {
  animation: nudge 1.6s ease-in-out infinite;
}
.frame__hint.is-hidden {
  opacity: 0 !important;
}
@keyframes nudge {
  50% {
    transform: translateY(4px);
  }
}

/* ---- mobile: no rail, burger moves right ---- */
@media (max-width: 767px) {
  .frame__line--rail,
  .frame__nav,
  .frame__mark .frame__brand,
  .frame__hint {
    display: none;
  }
  .frame__burger {
    left: auto;
    right: calc(var(--bar) * 2.4 + 4px);
    top: calc((var(--bar) - 40px) / 2);
  }
  .frame__mark {
    top: calc(var(--bar) / 2);
    left: 28px;
  }
  .frame__mark svg {
    width: 24px;
  }
  .frame__audio {
    top: calc((var(--bar) - 26px) / 2);
    bottom: auto;
    left: auto;
    right: calc(var(--bar) * 2.4 + 50px);
    transform: none;
  }
  .frame__tab {
    padding: 0 16px 0 22px;
    font-size: 0.68rem;
  }
}
</style>
