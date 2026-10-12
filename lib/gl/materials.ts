import { ShaderMaterial, VideoTexture } from 'three'
import { coverUvGLSL, noiseGLSL, planeVertex } from './glsl'
import type { SharedUniforms } from './Stage'

/** Reveal mask shared by the DOM-plane materials: wipes up from the bottom edge. */
const revealGLSL = /* glsl */ `
float revealMask(vec2 uv, float reveal) {
  float edge = reveal * 1.15 - 0.075;
  return smoothstep(edge + 0.075, edge, uv.y + (hash12(vec2(floor(uv.x * 24.0), 3.0)) - 0.5) * 0.08);
}
`

export interface VideoLook {
  /** Brightness at rest (1 = untouched). Hover always brings it to 1. */
  idleBrightness?: number
  /** RGB split at rest, in UV units (0 = sharp). Hover adds 0.01. */
  idleSplit?: number
  /** Scanline strength, 0..1. */
  scanlines?: number
}

/**
 * Video on a plane: cover-fit, scanlines, and an RGB split + zoom on hover.
 * The defaults give the gritty "raw feed" look; artwork should pass a
 * brighter, sharper `look`.
 */
export function createVideoMaterial(
  shared: SharedUniforms,
  video: HTMLVideoElement,
  { idleBrightness = 0.65, idleSplit = 0.004, scanlines = 0.12 }: VideoLook = {},
) {
  // No colour-space conversion: these ShaderMaterials write sRGB values
  // straight through, so the texture must not be decoded to linear either.
  const texture = new VideoTexture(video)
  const material = new ShaderMaterial({
    vertexShader: planeVertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap;
      uniform vec2 uTexSize;
      uniform vec2 uSize;
      uniform float uTime;
      uniform float uHover;
      uniform float uReveal;
      uniform float uIdleBrightness;
      uniform float uIdleSplit;
      uniform float uScanlines;
      varying vec2 vUv;

      ${noiseGLSL}
      ${coverUvGLSL}
      ${revealGLSL}

      void main() {
        vec2 uv = coverUv(vUv, uSize, uTexSize);
        uv = (uv - 0.5) * (1.0 - uHover * 0.06) + 0.5;
        float split = uIdleSplit + uHover * 0.01;
        vec3 col = vec3(
          texture2D(tMap, uv + vec2(split, 0.0)).r,
          texture2D(tMap, uv).g,
          texture2D(tMap, uv - vec2(split, 0.0)).b
        );
        col *= (1.0 - uScanlines) + uScanlines * sin(vUv.y * uSize.y * 1.6);
        col *= mix(uIdleBrightness, 1.0, uHover);
        col += (hash12(gl_FragCoord.xy + fract(uTime) * 73.0) - 0.5) * 0.05;
        gl_FragColor = vec4(col, revealMask(vUv, uReveal));
      }
    `,
    uniforms: {
      tMap: { value: texture },
      uTexSize: { value: [16, 9] },
      uTime: shared.uTime,
      uIdleBrightness: { value: idleBrightness },
      uIdleSplit: { value: idleSplit },
      uScanlines: { value: scanlines },
    },
    transparent: true,
    depthTest: false,
  })
  const syncSize = () => (material.uniforms.uTexSize.value = [video.videoWidth || 16, video.videoHeight || 9])
  video.addEventListener('loadedmetadata', syncSize)
  syncSize()
  return material
}
