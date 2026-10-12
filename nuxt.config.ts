// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  // Use plain component names (e.g. <HeroSection>) regardless of sub-folder.
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'NOVARA — Signal from the Drift',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'NOVARA is an open sci-fi world told through signals, factions and fragments.' },
        { name: 'theme-color', content: '#07090c' },
      ],
      script: [
        {
          // Remember a click/key that lands before the app has hydrated, so the
          // preloader's "click to enable sound" never misses an early click.
          innerHTML:
            "(function(){function m(e){if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;window.__earlySoundOptIn=true;removeEventListener('pointerdown',m,true);removeEventListener('keydown',m,true)}addEventListener('pointerdown',m,true);addEventListener('keydown',m,true)})()",
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500&display=swap',
        },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['three', 'gsap', 'gsap/ScrollTrigger', 'gsap/ScrollSmoother', 'gsap/ScrollToPlugin', 'howler'],
    },
  },
})
