<script setup lang="ts">
import { scroll } from '~/lib/scroll'
import { device } from '~/lib/device'

/** ScrollSmoother wrapper. Fixed UI must live outside this component. */
const { entered, isScrolling } = useAppState()
const wrapper = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!wrapper.value || !content.value) return
  scroll.create(wrapper.value, content.value, {
    smooth: device.reducedMotion ? 0 : 1.1,
    onUpdate: (self) => (isScrolling.value = Math.abs(self.getVelocity()) > 20),
  })
  // Stay put behind the preloader; released when the visitor enters.
  scroll.setPaused(!entered.value)
})

watch(entered, (v) => scroll.setPaused(!v))
onBeforeUnmount(() => scroll.kill())
</script>

<template>
  <div ref="wrapper" class="smooth-wrapper">
    <div ref="content" class="smooth-content">
      <slot />
    </div>
  </div>
</template>
