<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="btn-burger"
    :class="{ 'is-open': open }"
    type="button"
    :aria-expanded="open"
    aria-controls="site-menu"
    :aria-label="open ? 'Close menu' : 'Open menu'"
    @click="$emit('toggle')"
  >
    <span class="line line--a" />
    <span class="line line--b" />
  </button>
</template>

<style scoped>
.btn-burger {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
}

.line {
  position: absolute;
  left: 9px;
  height: 1.5px;
  background: currentColor;
  transition: transform 0.45s var(--ease-out), width 0.45s var(--ease-out);
}

.line--a {
  width: 22px;
  transform: translateY(-4px);
}

.line--b {
  width: 14px;
  transform: translateY(4px);
}

.btn-burger:hover .line--b {
  width: 22px;
}

.is-open .line--a {
  width: 22px;
  transform: rotate(45deg);
}

.is-open .line--b {
  width: 22px;
  transform: rotate(-45deg);
}
</style>
