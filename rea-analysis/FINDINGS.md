# kprverse.com: how it works (REA reverse-engineering findings)

Purpose: learn the **techniques** behind https://kprverse.com/ so an original site can be built. No assets, brand, copy, or minified code from the target are to be reused.

- Capture date: 2026-10-12 (Chrome 154 via CDP `http://127.0.0.1:9222`, target `36F826FCA945451714C54DC4A74A34DA`, "KPR | Story")
- Analysis type: **static** (shipped JS captured from the live page). No source maps are published.
- Runtime observation (`observe_web_session`) was not needed. Every question below was answered by shipped code. Statements about *timing* or *feel* that only runtime could confirm are marked **inferred**.

## Legend

| Tag | Meaning |
|---|---|
| **Observed** | Read directly in the shipped JavaScript captured by REA |
| **Inferred** | Reasoned from observed code, not seen executing |
| **Unknown** | Not determinable from the evidence collected |

## Evidence ledger

| Step | REA operation | Evidence ID |
|---|---|---|
| Target list | `list_browser_targets` | `ev_80c67bd5faa59567c2dcb5b8b7b80f6ea3956d0a58e2c1e18057ebd231fe5e93` |
| Page capture (scripts, a11y text, JSON shapes, 3 s window) | `inspect_web_page` | `ev_5ef97ced81b56f29c790911d40e2d0c69f0c248bf228b2be675578fd58a8109c` |
| Viewport screenshot (`screenshot-home.png`) | `capture_web_screenshot` | `ev_a0396076788e7eb47fa0c8cfae3141ebc69933718ae15b88d348e0c3cb28908d` |
| Bundle analysis (chunk graph, routes, vendors, source maps) | `analyze_web_bundle` | `ev_3a624cc5da7315f6bab685757ba16e05d9863f55e1bbcb8ca9075687ada1f568` |
| Script export to `./scripts` (137 files) | `export_web_scripts` | `ev_852e2c0cf9ee81aa92ee2d67d45b3d69ab366b22f646f41882bda623125dc44c` |
| Application graph (**parent**, retained) | `analyze_javascript_application` | `ev_b949733977a9e735b748f84e14fbf556727dae786fbf3029e2d486343a494645` |
| Application summary view | `inspect_analysis_view` | `ev_77db8f13f4c650de704604495825fe5cdd2a15e4f39fcc64ddd28db4be4356cd` |
| Module page (187 module nodes, see `module-nodes.json`) | `inspect_analysis_view` | `ev_48a2e50094da501d7a56e37f4d30c6d3372a820c3704c81363aad56291be55d0` |
| Module item: preloader | `inspect_analysis_view` | `ev_8404573fe259595d0466b982ac45f5bee636d6ad83cbfa1758ec0644df38b67a` |
| Feature trace, literal `LOAD_PROGRESS` (no match, see limitations) | `trace_application_feature` | `ev_550146e84180a5039dbcf3a8261bc44f2b851b3389ba2377b65a65a22a55d098` |

Per-module citations below use the REA **module node ID** (`jag_node_…`, from the parent graph) and the REA **script key** prefix (`scr_…`, from the export manifest).

### Coverage and limitations (carry these forward)

- 137/137 scripts were parsed with 0 parse failures and 650,222 AST nodes. Application-graph coverage is **partial**: REA's semantic result budget was exhausted, and 243 limitations are recorded.
- Capture is attach-limited. Network and console activity from before REA attached is unavailable.
- **Source maps: none available.** Every name below comes from file names, component `__name` fields, and literals in the minified code.
- `trace_application_feature` with property-name seeds returned `no-match`. REA notes this "is not evidence that the feature is absent". Feature tracing was therefore done by reading each exported module (static) and cross-checking imports in the chunk graph.

---

## 0. Stack and architecture (overview)

| Layer | Finding | Status |
|---|---|---|
| Framework | **Nuxt 3 / Vue 3** (`/_nuxt/` chunks, `__name` SFC setup, `nuxt-link`, `client-only`). REA vendor fingerprint: "Vue" (medium) | Observed |
| CMS | **Storyblok** (`Storyblok.*.js`, `cdn/stories` endpoint, nav fetched from `{lang}/global/the-nav`) | Observed |
| Animation | **GSAP** core plus plugins: **ScrollTrigger**, **ScrollSmoother**, **SplitText**, **DrawSVG**, **ScrollTo**. Injected as Nuxt plugin globals (`$gsap`, `$ScrollTrigger`, `$ScrollSmoother`, `$SplitText`) | Observed |
| WebGL | **three.js** (`three.module.*.js`) with GLTFLoader + DRACO + KTX2 (Basis) + Meshopt, and an SVGLoader | Observed |
| Audio | **Howler.js** (`Howl`, global `Howler.mute`) | Observed |
| Debug | **Tweakpane** GUI and `stats.js`, toggled via URL params (`?controls=true`, `?helpers=true`, `?postprocess=`) | Observed |
| Routes | `/`, `/citizen/…`, `/citizen2/:id?…`, a gallery, and a catch-all `[...slug]` (Storyblok pages) | Observed (`analyze_web_bundle`) |
| Web3 | wallet-connect / OpenSea modules exist. **Out of scope (skipped by request).** | Observed, not analysed |

Two state layers:
1. A **Vue/Pinia-style app store** (`useApp`) in `entry`, holding `loadProgress`, `pageReady`, `isMuted`, `showMenu`, `scroller`, `isScrolling`, and similar. **Observed**
2. A **framework-agnostic reactive store** for the WebGL world (`store.4d67c1b5`, `scr_3091470925a2eaa1`). It holds viewport (`vw`, `vh`, `dpr`), `scroll`, `pointer` (normalised and remapped to −1..1), `muted`, `pauseRenderer`, and a design-scale factor `vw / basew` (base 1600×850 desktop, 375×634 mobile). **Observed**

---

## a) Loading screen and progress percentage

**Modules:** `preloader` (`jag_node_e765e6e6…74e4`, `scr_d96bc33731621fd7`), `LoaderMixin` (`scr_0650c7da444b3717`), `loader-globals`, `content-home` (`scr_fd34a10b0e72fd16`), `Home` (`scr_7abd7f172c2b561b`), `the-console-loading` (`scr_cb6ccb5d23f3b3cf`), `transition-wipe` (`scr_2f6a5fe0a655993f`)

**How it works**
1. **Asset-loader manager (singleton).** Each WebGL component declares an `assets` map, e.g. `{ gltf: 'x.glb', atlas: 'y.webp#texture' }`. The loader type is chosen by file extension, or by an explicit `#type` suffix: json, image, texture, spritesheet, gltf, ktx. On setup, each component registers its loader group with a global manager. **Observed**
2. Global progress is the **mean of every registered loader's `progress`**. The manager emits `LOAD_PROGRESS`. When all loaders report COMPLETE, it emits `LOAD_COMPLETE` after a 100 ms debounce. glTF progress uses XHR `loaded/total`. **Observed**
3. `Home` subscribes `LOAD_PROGRESS → app.setLoadProgress(p)` and `LOAD_COMPLETE → setLoadProgress(1)`, then emits `loaded`. `content-home` lazy-imports `Home` and flips `app.preload`. **Observed**
4. **Preloader UI:**
   - A progress bar renders `transform: scaleX(loadProgress)`.
   - The label shows `"LOADING - " + floor(progress*100) + "%"`.
   - A fake "file path" ticker cycles through a list of strings, one every **random 150–400 ms** (`setTimeout` recursion).
   - A "Click/Tap to enable sound" CTA **follows the cursor** with lerp-smoothing (ease 0.4) on the RAF ticker. It is shown only while muted.
   - Show and hide are a GSAP `autoAlpha` tween.

   **Observed**
5. **Page transitions:** a Vue `<Transition name="wipe">` shows a frame layer plus a "// Loading Content" spinner while `!app.pageReady`. On first load it shows the full preloader instead. Route leave hooks set `TRANSITION.BEFORE_LEAVE/LEAVE/AFTER_LEAVE` and delay the route swap by 0.3 s with `gsap.delayedCall`. **Observed**
6. The "console" loader (`the-console-loading`) is a simpler variant: it tweens a `{percent}` object 0→1 over 0.6 s (linear) and renders a bar plus `%`. **Observed.** This shows that some loaders are *cosmetic* (time-based), not tied to real bytes. **Inferred** that the main preloader can also reach 100% quickly when assets are cached.

**Techniques:** a progress aggregator over many loader groups; `scaleX` progress bars (no layout thrash); cosmetic text tickers; lerped cursor follower.
**Unknown:** exact asset list and weights per page (depends on runtime tier, e.g. `textureSize`, mobile `Xt` flags).

---

## b) "hacky-text" glitch / decode effect

**Modules:** `hacky-text` (`jag_node_c958b19e…3bca0`, `scr_ccd471660389d435`). Used by `menu-nav-item` (`scr_05fb50364865a573`) and by custom-material/UI elements.

**How it works (Observed)**
- The slot text is rendered twice: once in an invisible **spacer**, which keeps layout and size stable, and once in an **animation** layer whose text is rebuilt every frame.
- On mount, it reads `innerText`, splits it into lines, and counts the total characters `N`.
- Two numbers are tweened with GSAP, both linear:
  - `at` (0→N): the "typed in" cursor. Each line shows `substring(0, at)`. Duration is `0.04·N` s × speed.
  - `glitch` (0→N): the resolve cursor. Characters past `glitch` are **replaced by random letters** from an A–Z/a–z pool. Duration is `(0.04·N + 0.4)` s × speed. Its `onUpdate` rebuilds the string.
- Because `glitch` runs a little longer than `at`, you see typed characters that scramble and then resolve.
- **Triggers:**
  - `autoAppear`: a ScrollTrigger with `start: "center bottom"`. It can be limited to once (`appearOnce`).
  - Hover: via `useElementHover` or an `externalHovering` prop, re-runs the glitch (re-entrancy guarded).
  - Imperative `animateIn(delay, speed)` / `reset()`, used by the menu.
- **Disabled on mobile**: the text is shown statically.

**Inferred:** `aria` handling isn't explicit. The spacer keeps the real text in the DOM, so screen readers likely read it twice. Improve on this in the rebuild with `aria-hidden` on the animation layer.

---

## c) WebGL canvas: renderer, shaders, render loop

**Modules:** renderer `index.d22011ff` (`scr_f4490f160635a673`), `store` (`scr_3091470925a2eaa1`), `useRaf` (`jag_node_e163510f…d778`, `scr_e6d3a7bfbfb65d1b`), `lerp` (`jag_node_e6804bd9…b3f`, `scr_725d1bf6c410c756`), `custom-material` (`jag_node_db2f56e1…039f`, `scr_ab86cc0318a68148`), `simple-three` (`scr_04429542e626e6ed`), `three-object` (`scr_33d83c5301df124c`), `create-canvas` (`jag_node_0b8fc68e…b520`, `scr_e179e0dc95556f2c`), `gozer-env` (`jag_node_9f1f41af…c1d7`, `scr_f864a20eb0f2ce9e`), `Home` (`scr_7abd7f172c2b561b`)

**Renderer (Observed)**
- One `WebGLRenderer({ antialias: false })` with **DPR capped at 1.5**, a transparent clear (`clearColor 0, alpha 0`), and `autoClear = false` (manual multi-pass clearing).
- Two cameras: an **orthographic camera** for UI/screen-space layers and a **perspective camera** (fov 32, near 0.1, far 50). A camera system per scene adds slight pointer-driven rotation (`maxRotation ≈ 0.2`).
- **Layers** (`mesh.layers.set(layer)`) separate the world and UI passes. Render targets are used for blur/pattern passes and masking.

**Scene content (Observed)**
- Each home "tableau" is a **GLB (Draco + KTX2 textures)** of stacked 2.5D planes. On load, each mesh's material is replaced with a **custom ShaderMaterial** carrying its own `uTexture`. Render order comes from `userData.order`.
- Animated layers use **sprite-sheet atlases** (TexturePacker-style JSON plus a `.webp` atlas). The shader samples one frame using `uFrame`, `uSpriteSourceSize`, and `uSourceSize`.
- Shader uniforms seen include `uTime`, `uResolution`, `uAlpha`, `uColor`, `tNoise`/`uNoise`, `uNoiseIntensity`, `uMaskStart`/`uMaskEnd`, `uGradient`/`uGradientProgress` (a "sheen wipe"), `uFlickProgress`, `uExposure`, `uDraw`, `uLod`, and `uPurple*`. Effects implied: noise grain, flicker, gradient sheen wipe, masked reveals, and cover-fit UV resizing (`UVResize(vUv, uSize, uTextureSize, scale)`).
- Textures are tiered by device (`textureSize` variants; mobile flags `Xt`/`Gt` from `gozer-env`).

**Render loop (Observed)**
- There is a single **RAF manager** registered on **`gsap.ticker`**. The page has one clock shared by GSAP tweens and rendering.
- Components subscribe through `useRaf(cb, {order})`. It starts on mount/activate and stops on unmount/deactivate, and it reports `isFirstTick`.
- Smoothing uses a small **Lerp class** `{current, target, ease}.update(target)`, applied per frame: `current += (target - current) * ease`. Used for the cursor follower, camera, and video scrub.
- A `pauseRenderer` flag stops rendering when the canvas is off-screen or a page is hidden. **Inferred** from store fields; its exact call sites were not traced.

**Utilities:**
- `create-canvas` makes a DPR-aware 2D canvas, capped at 2×. Used for generated textures (e.g. text/SVG to texture). **Observed**
- `gozer-env` is only UA/device detection (mobile/tablet/iPadOS). **Observed**

**Unknown:** full GLSL source for every effect (only uniform names and fragments were read). Post-processing is optional (`?postprocess=`), and its exact pass chain was not traced.

---

## d) Scroll-triggered animations

**Modules:** `the-smooth-scroll` (`jag_node_fc8bd8ec…f0f2`, `scr_8ad40dce27318b32`), `useScrollTrigger` (`jag_node_93c5074a…7e5b`, `scr_b584019312800487`), `scroll-to` (`jag_node_ef3f6699…a0a`, `scr_28e85ac4c8787d55`), `the-frame` (`jag_node_de239467…cc68`, `scr_b4d6a508efe895dd`), `the-frame-progress` (`jag_node_2ec34015…5d94`, `scr_c56ccf8feb75d40a`), `Home`

**How it works (Observed)**
- **Smooth scroll:** GSAP **ScrollSmoother** wraps the page in a `.smooth-wrapper > .smooth-content` pair (`smooth: 1`, `effects: false`). It starts **paused** until the page is ready (`toggleScrollerPause`). `onUpdate` sets `app.isScrolling` when `|velocity| > 20`. The instance is stored globally (`window.scroller`).
- **`useScrollTrigger(factory)`** is a composable that creates a tween or ScrollTrigger on mount, **rebuilds it when the breakpoint changes**, and kills it on unmount and deactivate.
- **Home = one master timeline in scroll pixels.**
  - Every section and scene builds a sub-timeline whose durations are in **px/vh units**, and adds it to a master `tl`.
  - On scroll, the master is driven with `tl.seek(scrollY)`.
  - On resize, everything is rebuilt and re-seeked.
  - Sounds are also timeline-synced (a sound manager receives the same `tl`).

  This is a "scroll-as-timeline" design, not many independent ScrollTriggers.
- **Frame masks:** frame sections tween custom `maskTop`/`maskBottom` (or opacity) with `scrollTrigger: {scrub: true}`. The ranges are `top bottom → top top` (in) and `bottom top → …` (out). This gives wipe-reveals as sections enter and exit.
- **Scroll progress bar:** `scrollTop / (scrollHeight - innerHeight)` is computed every frame and rendered as `translateX`.
- **Scroll-to:** `gsap.to(window, {scrollTo: y, ease: "power2.out"})` with **distance-proportional duration** (`0.0005 s/px`).

**Inferred:** the scroll value feeding `tl.seek` comes from the ScrollSmoother's smoothed position, so WebGL and DOM motion share the same easing.

---

## e) Hover sound effects and audio on/off

**Modules:** `hover-sfx` (`jag_node_7955a5a3…d4ce`, `scr_65f1d4a07c48cbaf`), `btn-audio` (`scr_0fedfc2801bb7c3e`), layout `default` (`jag_node_1a8c48b3…fbf7`, `scr_eebc44c8ce02453f`), `menu-nav-item`, `link-hover` (`scr_769b08dfecd3caed`), `Home`

**How it works (Observed)**
- **Global mute:** `app.isMuted` starts `true`. The layout watches it and calls **`Howler.mute(isMuted)`**, so a single switch silences every Howl.
- Audio is only unlocked by a user gesture: the preloader's "Click/Tap to enable sound" CTA. This satisfies browser autoplay policy. **Inferred** from the CTA plus the initial muted state.
- **`<hover-sfx>`** is a wrapper component that creates `Howl`s for an enter sound (default UI rollover) and an optional leave sound. It plays them when hover state changes, and hover can be driven externally.
- Menu items and buttons create their own rollover `Howl`.
- **Audio button visual:** 5 vertical bars, each running an infinite GSAP tween of `scaleY` with `repeatRefresh: true`. Each repeat picks a new random height (0.2 to 1.0) when unmuted and stays flat at 0.2 when muted.
- **Scene audio:** intro stingers (one sound on first visit, an alternate on return; `skipIntro` stored), looping ambience via **Howler sprites** (loop regions), transition IN/OUT sounds per scene, and a "sheen" sound synced with a shader wipe.
- **Link hover (visual):** a background block slides `x: -101% → 0` on enter and `0 → 101%` on leave, while the text colour inverts. The inverse colour is computed from the current computed colour.

---

## f) Navigation frame, burger menu, submenu transitions

**Modules:** `btn-burger` (`scr_2872610857e9cae8`), `the-menu` (`jag_node_25b5f21c…a66a`, `scr_1d057d911e8b0aba`), `menu-nav-item` (`jag_node_4a250b4c…cac0`, `scr_05fb50364865a573`), `the-frame` (`scr_b4d6a508efe895dd`), `the-frame-layer` (`jag_node_1c790003…d66f`), `the-frame-submenu` (`jag_node_b4d24047…6ac7`), `get-corner-cut-points` (`scr_29eaae7447bdcce1`)

**How it works (Observed)**
- **Frame:** a fixed UI chrome (thin border box, top nav, left rail, corner details) sits over the content, as in the screenshot. Shapes use **corner-cut polygons**: a helper returns rectangle points with one corner chamfered by an `inset` (`tl`/`tr`/`br`/`bl`). These are rendered as SVG/clip-path, which gives the angled "SIGN IN" tab and the nav chips.
- **Burger:** an SVG with two lines of unequal length (pure CSS hover state).
- **Menu open:**
  1. `display:block`, then an instant reset of the positions (left panel `x:-100%`, right panel `x:100%`, items `x:-4em; opacity 0`).
  2. Build a **paused linear inner timeline**: bars slide in first, then the content panels slide in. The split point is a ratio `Pe`.
  3. An **outer tween animates the inner timeline's `progress` from 0 to 1** over 0.7 s with `power2.inOut`. This eases the whole multi-step sequence as a single curve.
  4. Items stagger in (`x:-200→0`, `quint.out`, `stagger 0.05`). Each item's label runs **hacky-text `animateIn`** with an increasing delay.
  5. An open sound plays.
- **Menu close:** the mirror timeline runs at `timeScale(0.5/0.3)` (faster), plays a close sound, then sets `display:none`. Route change auto-closes the menu.
- **Menu item:** the label (hacky-text) shows a "PAGE 00N" caption on hover or when active, plays a rollover sound, and has a corner-cut background graphic.
- **Nav data** comes from the Storyblok story `{lang}/global/the-nav`.

---

## g) Video sections

**Modules:** `video-overlay` (`jag_node_4e9ded69…5857`, `scr_4c835f2eac0ea6aa`), `Home` (trailer/side-media)

**How it works (Observed)**
- **In-scene video:** the home scenes create `<video>` elements with **both `.mp4` and `.webm` `<source>`s**, plus a poster image. A WebGL plane shader takes the video as `tMap` (video texture), so the video lives inside the 3D composition.
- **Fullscreen overlay player (`video-overlay`):**
  - A custom UI with play/pause on click and a time readout `m:ss`.
  - A progress bar rendered via `translateX`, updated each RAF from `currentTime/duration`.
  - **Scrubbing by pointer/touch move** over the bar sets `currentTime = ratio × duration`.
  - The mute button is bound to the global `app.isMuted`, and the video's `muted` follows it.
  - A fullscreen toggle with a WebKit fallback.
  - A lerp-smoothed custom cursor follower.
  - Controls auto-show on desktop.

**Unknown:** exact video sources and encodings (content specific; not needed).

---

## Summary: techniques to recreate (in our own code)

1. A Nuxt 3 SPA with a persistent layout and a **fixed UI frame** over a **single fixed WebGL canvas**.
2. A **global asset-loader manager** that aggregates progress, drives a preloader with a `%` label, and unlocks audio through a CTA.
3. A **decode/glitch text** component (spacer plus animated layer, two tweened cursors).
4. A **three.js renderer** (DPR ≤ 1.5, no AA, manual clear, ortho + perspective cameras) with **custom shader planes** (noise, sheen wipe, masked reveal, cover-fit UVs).
5. **One RAF manager on `gsap.ticker`**, a `useRaf` composable, and a Lerp helper.
6. **Smooth scroll** with a master **scroll-pixel timeline** (`tl.seek(scroll)`), plus scrubbed mask reveals.
7. **Howler** with a global mute, hover SFX wrapper, and an animated equalizer button.
8. A **menu built from nested timelines** (outer eased progress over an inner linear sequence) with staggered glitch labels.
9. **Video**: WebGL video textures and a custom overlay player with scrubbing.

### Open items (needs runtime evidence if they matter)

- Exact post-processing chain and full GLSL of each effect (only partial).
- Per-device asset tiers chosen at runtime.
- Where `pauseRenderer` is toggled.

### Licensing note for the rebuild

GSAP is now free including the former Club plugins (ScrollSmoother, SplitText, DrawSVG), after the Webflow acquisition. **Confirm the current GSAP licence before shipping.** Alternatives: **Lenis** (smooth scroll, MIT) with ScrollTrigger. Fonts, sounds, images, story text and logos from the target **must not** be reused.
