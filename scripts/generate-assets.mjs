// Generates every placeholder sound and the placeholder video procedurally.
// Nothing is sampled from any existing work: each file is a math function.
//
//   npm run assets            (skips files that already exist)
//   npm run assets -- --force
//
// Sounds:  pure JavaScript synthesis → public/audio/*.wav (no dependencies)
// Video:   ffmpeg (ffmpeg-static dev dependency) → public/video/signal.{mp4,webm}

import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = join(root, 'public', 'audio')
const videoDir = join(root, 'public', 'video')
mkdirSync(audioDir, { recursive: true })
mkdirSync(videoDir, { recursive: true })

const force = process.argv.includes('--force')
const SAMPLE_RATE = 44100
const { sin, exp, min, PI } = Math
const TAU = 2 * PI

// Seeded noise so files are identical on every run.
let seed = 1337
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return (seed / 4294967296) * 2 - 1
}

// ---------------------------------------------------------------- sounds
// Each sound is f(t) → sample in -1..1 for t in seconds.
const sounds = {
  // Short bright chirp for hovering links.
  'ui-hover': { d: 0.09, f: (t) => 0.45 * sin(TAU * (1700 * t + 7000 * t * t)) * exp(-55 * t) },
  // Softer, lower blip for leaving.
  'ui-hover-out': { d: 0.08, f: (t) => 0.3 * sin(TAU * (1100 * t - 2000 * t * t)) * exp(-60 * t) },
  // Two-partial click.
  'ui-click': { d: 0.14, f: (t) => 0.5 * sin(TAU * 1250 * t) * exp(-70 * t) + 0.25 * sin(TAU * 2500 * t) * exp(-110 * t) },
  // Rising sweep with a breath of noise: menu opening.
  'menu-open': {
    d: 0.75,
    f: (t) => 0.32 * sin(TAU * (180 * t + 850 * t * t)) * min(1, t * 10) * exp(-2.6 * t) + 0.08 * noise() * exp(-7 * t),
  },
  // Falling sweep: menu closing.
  'menu-close': { d: 0.5, f: (t) => 0.3 * sin(TAU * (1000 * t - 750 * t * t)) * min(1, t * 20) * exp(-4.5 * t) },
  // Gated high ticks for the decode text effect.
  decode: { d: 0.45, f: (t) => 0.22 * sin(TAU * 3100 * t) * (sin(TAU * 31 * t) > 0.2 ? 1 : 0) * exp(-3.5 * t) },
  // Low boom with a slow shimmer: entering the site.
  intro: {
    d: 3.2,
    f: (t) =>
      0.62 * sin(TAU * (48 + 30 * exp(-3 * t)) * t) * exp(-1.1 * t) +
      0.1 * sin(TAU * 660 * t) * (0.5 + 0.5 * sin(TAU * 2.5 * t)) * exp(-1.3 * t) +
      0.06 * sin(TAU * 990 * t) * exp(-1.8 * t),
  },
  // 16 s seamless pad: every frequency × 16 s is a whole number of cycles,
  // so the loop point is click-free.
  'ambient-loop': {
    d: 16,
    f: (t) =>
      0.1 * sin(TAU * 55 * t) +
      0.07 * sin(TAU * 82.5 * t) * (0.6 + 0.4 * sin(TAU * 0.125 * t)) +
      0.06 * sin(TAU * 110 * t) * (0.6 + 0.4 * sin(TAU * 0.0625 * t + 1)) +
      0.035 * sin(TAU * 165 * t) * (0.5 + 0.5 * sin(TAU * 0.1875 * t)) +
      0.02 * sin(TAU * 247.5 * t) * (0.5 + 0.5 * sin(TAU * 0.25 * t + 2)),
  },
}

/** Encodes mono float samples as a 16-bit PCM WAV file. */
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // fmt chunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28) // byte rate
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

for (const [name, { d, f }] of Object.entries(sounds)) {
  const file = join(audioDir, `${name}.wav`)
  if (!force && existsSync(file)) continue
  const n = Math.round(d * SAMPLE_RATE)
  const fade = Math.round(0.004 * SAMPLE_RATE) // 4 ms edges avoid clicks
  const samples = Array.from({ length: n }, (_, i) => {
    const edge = name === 'ambient-loop' ? 1 : Math.min(1, i / fade, (n - i) / fade)
    return f(i / SAMPLE_RATE) * edge
  })
  writeFileSync(file, wav(samples))
  console.log(`• ${name}.wav (${(statSync(file).size / 1024).toFixed(0)} KB)`)
}

// ----------------------------------------------------------------- video
// 8 s "carrier wave" clip: animated gradient, oscilloscope trace of its own
// soundtrack, grid, grain and vignette.
let ffmpeg = null
try {
  ffmpeg = (await import('ffmpeg-static')).default
} catch {}

const videoMp4 = join(videoDir, 'signal.mp4')
const videoWebm = join(videoDir, 'signal.webm')
// Bootstrap only: never overwrite an existing signal video, even with --force,
// because public/video/signal.* now holds the real transmission clip.
const needVideo = !process.argv.includes('--no-video') && (!existsSync(videoMp4) || !existsSync(videoWebm))

if (needVideo && (!ffmpeg || !existsSync(ffmpeg))) {
  console.warn('! ffmpeg-static binary not found; skipping video. Re-run once `npm install` has finished.')
} else if (needVideo) {
  const run = (args, label) => {
    process.stdout.write(`• ${label} … `)
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] })
    console.log('ok')
  }
  const D = 8
  const carrier =
    '0.35*sin(2*PI*110*t)*(0.5+0.5*sin(2*PI*0.5*t))+0.2*sin(2*PI*220*t+3*sin(2*PI*0.75*t))+0.08*(2*random(0)-1)*gt(sin(2*PI*1.5*t)\\,0.7)'
  const inputs = [
    '-f', 'lavfi', '-i', `gradients=s=1280x720:c0=0x07090c:c1=0x14505e:c2=0x3a1a5c:c3=0xff5a1f:n=4:speed=0.03:r=30:d=${D}`,
    '-f', 'lavfi', '-i', `aevalsrc=${carrier}:s=48000:d=${D}`,
  ]
  const filter = [
    '[1:a]asplit=2[aw][aout]',
    '[aw]showwaves=s=1280x260:mode=cline:rate=30:colors=0x5ff2ff:scale=sqrt,format=rgba,colorchannelmixer=aa=0.85[wave]',
    '[0:v][wave]overlay=0:230:format=auto[mix]',
    '[mix]drawgrid=w=64:h=64:t=1:c=white@0.06,noise=alls=14:allf=t,vignette=PI/4.5,format=yuv420p[v]',
  ].join(';')
  const common = ['-filter_complex', filter, '-map', '[v]', '-map', '[aout]', '-t', String(D)]
  run([...inputs, ...common, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '96k', videoMp4], 'signal.mp4')
  run([...inputs, ...common, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-c:a', 'libopus', '-b:a', '96k', videoWebm], 'signal.webm')
  run(['-i', videoMp4, '-ss', '2.5', '-frames:v', '1', '-q:v', '4', join(videoDir, 'signal-poster.jpg')], 'signal-poster.jpg')
}

console.log('Assets ready.')
