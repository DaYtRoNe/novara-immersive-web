# novara-immersive-web

**A study in building immersive, story-driven websites**: WebGL scenes, scroll-driven
storytelling, decode-text effects and interactive sound, rebuilt from scratch around
an original placeholder world called NOVARA.

The techniques were learned by reverse-engineering how a production story site works
(notes in [`rea-analysis/FINDINGS.md`](rea-analysis/FINDINGS.md)), then re-implemented
in clean, readable code. No code, assets, fonts, copy or branding from that site are
used: every visual is a shader, every sound and the video are synthesized by
`scripts/generate-assets.mjs`, and fonts come from Google Fonts.

## Run it

```bash
npm install
npm run assets   # sounds: pure-JS synthesis → public/audio/*.wav
                 # video:  ffmpeg-static   → public/video/signal.{mp4,webm}
npm run dev
```

## Stack

| Concern | Library |
|---|---|
| Framework | Nuxt 3 (Vue 3, TypeScript) |
| WebGL | three.js (custom `ShaderMaterial`s, no models) |
| Animation / scroll | GSAP: ScrollTrigger, ScrollSmoother, ScrollTo |
| Audio | Howler.js |

## How each feature works

| Feature | Files | Technique |
|---|---|---|
| **Loader and percentage** | `lib/loader.ts`, `components/ThePreloader.vue`, `layouts/default.vue` | Weighted progress over tasks from anywhere in the app (fonts, sounds, video bytes via streamed `fetch`, shader compile, minimum time). The displayed % eases toward the real value. Entering unlocks audio. |
| **Decode text** | `components/HackyText.vue` | Two tweened cursors (typed and resolved). Characters between them are random glyphs. Real text stays in the DOM for screen readers and the scramble layer is `aria-hidden`. Triggered by scroll, hover or `play()`. |
| **WebGL canvas** | `lib/gl/*`, `components/WebglStage.vue`, `components/GlPlane.vue` | One fixed canvas with 3 passes: noise background, perspective "shards" (instanced triangles drawn with barycentric edges, morphing into a halo), and pixel-space planes glued to DOM boxes (sigil cards, video texture). DPR ≤ 1.5, no MSAA. |
| **Render loop** | `lib/raf.ts`, `composables/useRaf.ts`, `lib/lerp.ts` | A single ordered frame loop on `gsap.ticker`. `Smoothed` values give frame-rate-independent lerp. |
| **Scroll** | `lib/scroll.ts`, `components/SmoothScroll.vue`, `composables/useScrollStory.ts`, `components/RevealMask.vue` | ScrollSmoother, plus a per-page **timeline measured in scroll pixels** that is `seek()`ed every frame. It drives WebGL state (formation, camera, tint) and DOM parallax. Masks are scrubbed `clip-path`s. |
| **Sound** | `lib/audio.ts`, `components/HoverSfx.vue`, `components/BtnAudio.vue` | A central sound registry with throttling and a global `Howler.mute()`. The equaliser button uses `repeatRefresh` random tweens. |
| **Frame and menu** | `components/TheFrame.vue`, `components/TheMenu.vue`, `components/MenuNavItem.vue`, `lib/corner-cut.ts` | Fixed chrome with corner-cut `clip-path`s. The menu is a paused linear "sequence" timeline whose `progress` is tweened with an ease, giving one gesture for many steps. Esc closes and focus is managed. |
| **Video** | `components/sections/SignalSection.vue`, `components/VideoOverlay.vue` | A video texture on a DOM-synced plane (RGB split on hover), plus a full-screen player with drag scrubbing, keyboard seek, global mute and fullscreen. |
| **Page transitions** | `app.vue`, `components/TransitionWipe.vue` | JS `<Transition>` hooks: cover, swap, reset scroll, refresh triggers, uncover. |

## Before shipping

- Convert `public/audio/*.wav` to `.webm`/`.mp3` (the ambient loop WAV is about 1.4 MB) and list both in `lib/audio.ts`.
- Check the current GSAP licence terms for ScrollSmoother.
- Replace the placeholder world, copy and sounds with your own.

## Editing content

All copy lives in [`content/site.ts`](content/site.ts). Faction card art is
procedural: change `tint` and `seed` to restyle it.
