<script setup lang="ts">
import { playSound, type SoundName } from '~/lib/audio'

/** Wrap any interactive element to give it enter/leave hover sounds. */
const props = withDefaults(
  defineProps<{
    enter?: SoundName | null
    leave?: SoundName | null
    click?: SoundName | null
    externalHover?: boolean
  }>(),
  { enter: 'hover', leave: null, click: 'click', externalHover: undefined },
)

const root = ref<HTMLElement | null>(null)
const selfHover = useHover(root)
const hovering = computed(() => props.externalHover ?? selfHover.value)

watch(hovering, (h) => {
  const name = h ? props.enter : props.leave
  if (name) playSound(name)
})

const onClick = () => props.click && playSound(props.click, { throttleMs: 0 })
</script>

<template>
  <span ref="root" class="hover-sfx" @click="onClick"><slot /></span>
</template>

<style scoped>
.hover-sfx {
  display: contents;
}
</style>
