<script setup lang="ts">
/**
 * NOVARA wordmark (geometric caps, crossbar-less A). Geometry matches
 * brand/svg/wordmark.svg. `outline` draws it as a thin stroke instead of solid.
 */
withDefaults(defineProps<{ outline?: boolean }>(), { outline: false })
</script>

<template>
  <svg class="logo-wordmark" :class="{ 'is-outline': outline }" viewBox="0 0 704 100" role="img" aria-label="NOVARA">
    <g fill-rule="evenodd">
      <path d="M0 100V0H22L58 60V0H80V100H58L22 40V100Z" />
      <path transform="translate(114 0)" d="M20 0H72Q92 0 92 20V80Q92 100 72 100H20Q0 100 0 80V20Q0 0 20 0ZM26 22Q22 22 22 26V74Q22 78 26 78H66Q70 78 70 74V26Q70 22 66 22Z" />
      <path transform="translate(240 0)" d="M0 0H24L46 70L68 0H92L59 100H33Z" />
      <path transform="translate(366 0)" d="M0 100L33 0H59L92 100H68L46 30L24 100Z" />
      <path transform="translate(492 0)" d="M0 100V0H64Q84 0 84 20V38Q84 56 66 57L86 100H61L43 58H22V100ZM22 20V38H58Q62 38 62 34V24Q62 20 58 20Z" />
      <path transform="translate(612 0)" d="M0 100L33 0H59L92 100H68L46 30L24 100Z" />
    </g>
  </svg>
</template>

<style scoped>
.logo-wordmark {
  display: block;
  width: 100%;
  height: auto;
  fill: currentColor;
}

.logo-wordmark.is-outline {
  fill: none;
  stroke: currentColor;
  stroke-width: 1px;
}

/* Not inherited, so set it on the paths: keeps a 1px line at any size. */
.is-outline path {
  vector-effect: non-scaling-stroke;
}
</style>
