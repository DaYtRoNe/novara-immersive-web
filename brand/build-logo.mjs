// Builds clean SVG versions of the four NOVARA logo concepts (redrawn from
// brand/source/logo-concepts-gpt.webp) plus the wordmark and lockups.
//
//   node brand/build-logo.mjs
//
// All shapes use `currentColor`, so CSS `color` recolours them.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'svg')
mkdirSync(out, { recursive: true })

const C = 60 // symbol centre (viewBox 0 0 120 120)
const f = (n) => +n.toFixed(2)

/** Arc from a0° to a1° (0° = right, counter-clockwise, like maths). */
function arc(r, a0, a1, cx = C, cy = C) {
  const p = (a) => [f(cx + r * Math.cos((a * Math.PI) / 180)), f(cy - r * Math.sin((a * Math.PI) / 180))]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  return `M${x0} ${y0}A${r} ${r} 0 ${large} 0 ${x1} ${y1}`
}
const arcs = (r, w, spans) => `<path d="${spans.map(([a, b]) => arc(r, a, b)).join('')}" stroke-width="${w}"/>`
const line = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="${w}"/>`
const dot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`
const mirror = (spans) => spans.flatMap(([a, b]) => [[a, b], [180 - b, 180 - a]])

const symbols = {
  // 1 — "Beacon": a broken ring crossed by the relay mast.
  beacon: [
    line(C, 2, C, 118, 4.5),
    arcs(40, 10, [[100, 165], [180, 260], [280, 345], [0, 80]]),
    dot(C, C, 17),
  ],
  // 2 — "Broadcast": the source dot radiating signal arcs left and right.
  broadcast: [
    line(C, 3, C, 15, 4),
    line(C, 105, C, 117, 4),
    arcs(19, 5, mirror([[-42, 42]])),
    arcs(31, 5, mirror([[-50, 50]])),
    arcs(45, 6.5, mirror([[22, 70], [-12, 12], [-70, -22]])),
    dot(C, C, 10),
  ],
  // 3 — "Orbit": a tilted, broken orbit around the relay, with two satellites.
  orbit: [
    `<g transform="rotate(-16 ${C} ${C})"><ellipse cx="${C}" cy="${C}" rx="49" ry="23" stroke-width="3.6" pathLength="100" stroke-dasharray="38 12" stroke-dashoffset="-6"/>` +
      `${dot(C - 49, C, 4.5)}${dot(C + 49, C, 4.5)}</g>`,
    line(C, 17, C, 103, 3.6),
    dot(C, 6, 4),
    dot(C, 114, 4),
    dot(C, C, 16),
  ],
  // 4 — "Lock": a crosshair locking onto the signal (equaliser bars inside).
  lock: [
    line(C, 2, C, 118, 4),
    arcs(37, 6, [[18, 72], [108, 162], [198, 252], [288, 342]]),
    line(2, 57, 18, 57, 3.5),
    line(22, 57, 30, 57, 3.5),
    line(6, 64, 26, 64, 3.5),
    line(102, 57, 118, 57, 3.5),
    line(90, 57, 98, 57, 3.5),
    line(94, 64, 114, 64, 3.5),
    line(45, 49, 45, 71, 3.5),
    line(51, 43, 51, 77, 3.5),
    line(69, 43, 69, 77, 3.5),
    line(75, 49, 75, 71, 3.5),
    dot(C, C, 6),
  ],
}

const symbolSvg = (parts, size = 120) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-linecap="butt">${parts.join('')}</svg>`

// ---------------------------------------------------------------- wordmark
// Geometric caps on a 100-unit cap height; the A is drawn without a
// crossbar (Λ), as in the concept sheet.
const glyphs = {
  N: { w: 80, d: 'M0 100V0H22L58 60V0H80V100H58L22 40V100Z' },
  O: { w: 92, d: 'M20 0H72Q92 0 92 20V80Q92 100 72 100H20Q0 100 0 80V20Q0 0 20 0ZM26 22Q22 22 22 26V74Q22 78 26 78H66Q70 78 70 74V26Q70 22 66 22Z' },
  V: { w: 92, d: 'M0 0H24L46 70L68 0H92L59 100H33Z' },
  A: { w: 92, d: 'M0 100L33 0H59L92 100H68L46 30L24 100Z' },
  R: { w: 86, d: 'M0 100V0H64Q84 0 84 20V38Q84 56 66 57L86 100H61L43 58H22V100ZM22 20V38H58Q62 38 62 34V24Q62 20 58 20Z' },
}
const TRACK = 34
function wordmark(text = 'NOVARA') {
  let x = 0
  const paths = [...text].map((ch) => {
    const g = glyphs[ch]
    const p = `<path transform="translate(${x} 0)" d="${g.d}"/>`
    x += g.w + TRACK
    return p
  })
  return { width: x - TRACK, body: `<g fill="currentColor" fill-rule="evenodd">${paths.join('')}</g>` }
}

const wm = wordmark()
writeFileSync(join(out, 'wordmark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wm.width} 100" fill="currentColor">${wm.body}</svg>\n`)

for (const [name, parts] of Object.entries(symbols)) {
  writeFileSync(join(out, `symbol-${name}.svg`), symbolSvg(parts) + '\n')
  // Lockup: symbol scaled to 1.5× cap height, then a gap, then the wordmark.
  const s = 150 / 120
  const gap = 46
  const w = 150 + gap + wm.width
  writeFileSync(
    join(out, `lockup-${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -25 ${w} 150" fill="none" stroke="currentColor">` +
      `<g transform="translate(0 -25) scale(${s})">${parts.join('')}</g>` +
      `<g transform="translate(${150 + gap} 0)">${wm.body}</g></svg>\n`,
  )
}

console.log('Wrote:', Object.keys(symbols).map((n) => `symbol-${n}.svg, lockup-${n}.svg`).join(', '), '+ wordmark.svg')
