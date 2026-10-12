<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scroll } from '~/lib/scroll'
import { pageWipe } from '~/composables/usePageWipe'
import type { TransitionProps } from 'vue'

const { pageReady } = useAppState()

/** Page transition: wipe covers → swap page → reset scroll → wipe uncovers. */
const pageTransition: TransitionProps = {
  mode: 'out-in',
  css: false,
  async onLeave(_el, done) {
    pageReady.value = false
    await pageWipe.cover()
    done()
  },
  async onEnter(_el, done) {
    scroll.to(0, { immediate: true })
    await nextTick()
    ScrollTrigger.refresh()
    await pageWipe.uncover()
    pageReady.value = true
    done()
  },
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
</template>
