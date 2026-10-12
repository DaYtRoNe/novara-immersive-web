<script setup lang="ts">
import { site } from '~/content/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__top">
      <p class="footer__note">{{ site.footer.note }}</p>
      <ul class="footer__links">
        <li v-for="l in site.footer.links" :key="l.label">
          <HoverSfx>
            <a :href="l.href" class="type-mono"><LinkHover>{{ l.label }}</LinkHover></a>
          </HoverSfx>
        </li>
      </ul>
    </div>
    <p class="footer__word type-display" aria-hidden="true">{{ site.name }}</p>
    <div class="footer__bottom type-mono">
      <span>© {{ year }} {{ site.name }} — placeholder world</span>
      <span>Built with Nuxt, three.js, GSAP &amp; Howler</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  padding: 120px calc(var(--frame) + var(--gutter)) calc(var(--frame) + 24px) calc(var(--frame) + var(--rail) + var(--gutter));
  border-top: 1px solid var(--faint);
  background: linear-gradient(to bottom, transparent, rgb(7 9 12 / 0.85) 40%);
}

.footer__top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.footer__note {
  margin: 0;
  max-width: 44ch;
  color: var(--dim);
}

.footer__links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.footer__word {
  margin: 60px 0 24px;
  font-size: clamp(5rem, 26vw, 30rem);
  line-height: 0.75;
  color: transparent;
  -webkit-text-stroke: 1px var(--faint);
}

.footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--dim);
}
</style>
