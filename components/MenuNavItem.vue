<script setup lang="ts">
import type { NavItem } from '~/content/site'
import { cornerCutPolygon } from '~/lib/corner-cut'
import type HackyText from './HackyText.vue'

const props = defineProps<{ item: NavItem; index: number; active: boolean }>()
defineEmits<{ select: [to: string] }>()

const root = ref<HTMLElement | null>(null)
const label = ref<InstanceType<typeof HackyText> | null>(null)
const caption = ref<InstanceType<typeof HackyText> | null>(null)
const hovering = useHover(root)

const pageNumber = computed(() => `PAGE ${String(props.index + 1).padStart(3, '0')}`)
const clip = cornerCutPolygon(['tr', 'bl'], '18px')

defineExpose({
  animateIn(delay = 0) {
    label.value?.play({ delay })
    caption.value?.play({ delay: delay + 0.15, speed: 0.6 })
  },
  reset() {
    label.value?.hide()
    caption.value?.hide()
  },
})
</script>

<template>
  <li class="menu-item">
    <HoverSfx :external-hover="hovering">
      <a
        ref="root"
        :href="item.to"
        class="menu-item__link"
        :class="{ 'is-active': active, 'is-hover': hovering }"
        @click.prevent="$emit('select', item.to)"
      >
        <span class="menu-item__bg" :style="{ clipPath: clip }" aria-hidden="true" />
        <span class="menu-item__index type-mono">{{ String(index + 1).padStart(2, '0') }}</span>
        <HackyText ref="label" class="menu-item__label type-display" trigger="manual" :external-hover="hovering">
          {{ item.label }}
        </HackyText>
        <span class="menu-item__meta type-mono">
          <HackyText ref="caption" trigger="manual">{{ pageNumber }}</HackyText>
          <span class="menu-item__caption">{{ item.caption }}</span>
        </span>
      </a>
    </HoverSfx>
  </li>
</template>

<style scoped>
.menu-item {
  list-style: none;
}

.menu-item__link {
  position: relative;
  display: grid;
  grid-template-columns: 3.2em 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 8px 22px 8px 14px;
  color: var(--bone);
  isolation: isolate;
}

.menu-item__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--bone);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.45s var(--ease-out);
}

.is-hover .menu-item__bg {
  transform: scaleX(1);
}

.is-hover {
  color: var(--ink);
}

.is-active .menu-item__index {
  color: var(--signal);
}

.menu-item__index {
  color: var(--dim);
  transition: color 0.3s;
}

.is-hover .menu-item__index {
  color: var(--ink);
}

.menu-item__label {
  font-size: clamp(2.8rem, 7.2vw, 6.6rem);
}

.menu-item__meta {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
  white-space: pre;
}

.menu-item__caption {
  color: var(--dim);
  font-size: 0.62rem;
  transition: color 0.3s;
}

.is-hover .menu-item__caption {
  color: rgb(7 9 12 / 0.6);
}

@media (max-width: 767px) {
  .menu-item__link {
    grid-template-columns: 2.2em 1fr;
  }
  .menu-item__meta {
    display: none;
  }
}
</style>
