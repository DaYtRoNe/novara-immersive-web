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
    <div class="footer__word" aria-hidden="true">
      <LogoMark class="footer__mark" />
      <LogoWordmark :outline="true" />
    </div>
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

/* Full-width lockup: solid mark + outlined wordmark, sized to the column. */
.footer__word {
  display: grid;
  /* Grid, not flex: unsized SVGs don't shrink reliably as flex items. */
  grid-template-columns: 13% minmax(0, 1fr);
  align-items: center;
  gap: 3.5%;
  margin: 72px 0 28px;
  color: var(--faint);
}

.footer__mark {
  width: 100%;
  color: var(--signal);
}

.footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--dim);
}
</style>
