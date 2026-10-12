<script setup lang="ts">
import { assetLoader } from '~/lib/loader'
import { fadeSound, loadSounds, playSound, setMuted, unlockAudio } from '~/lib/audio'

const { loadProgress, loaded, entered, pageReady, isMuted } = useAppState()

/** Keep the preloader up long enough to read, even on a warm cache. */
const MIN_PRELOAD_MS = 1600

onMounted(() => {
  // Children registered their own tasks (shaders, video…) before this runs.
  assetLoader.add('fonts', async (report) => {
    await document.fonts.ready
    report(1)
  }, 0.5)
  assetLoader.add('sounds', loadSounds, 1)
  // Wall-clock based (not the GSAP ticker) so a background tab can't stall it.
  assetLoader.add('minimum', (report) => new Promise<void>((resolve) => {
    const start = performance.now()
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / MIN_PRELOAD_MS)
      report(p)
      if (p >= 1) {
        clearInterval(id)
        resolve()
      }
    }, 50)
  }), 1)

  assetLoader.on('progress', (p) => (loadProgress.value = p))
  assetLoader.once('complete', () => (loaded.value = true))
  assetLoader.start()

  setMuted(isMuted.value)
})

watch(isMuted, (muted) => setMuted(muted))

async function onEnter(withSound: boolean) {
  await unlockAudio()
  isMuted.value = !withSound
  playSound('intro', { throttleMs: 0 })
  fadeSound('ambient', 0.32, 3000)
  entered.value = true
  pageReady.value = true
}
</script>

<template>
  <div class="app">
    <WebglStage />
    <SmoothScroll>
      <slot />
      <TheFooter />
    </SmoothScroll>
    <TheFrame />
    <TheMenu />
    <TransitionWipe />
    <VideoOverlay />
    <ThePreloader @enter="onEnter" />
  </div>
</template>
