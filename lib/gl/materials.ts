import { ShaderMaterial, VideoTexture, Vector3 } from 'three'
import { coverUvGLSL, noiseGLSL, planeVertex } from './glsl'
import type { SharedUniforms } from './Stage'

/** Reveal mask shared by the DOM-plane materials: wipes up from the bottom edge. */
const revealGLSL = /* glsl */ `
float revealMask(vec2 uv, float reveal) {
  float edge = reveal * 1.15 - 0.075;
  return smoothstep(edge + 0.075, edge, uv.y + (hash12(vec2(floor(uv.x * 24.0), 3.0)) - 0.5) * 0.08);
}
`

/**
 * Procedural faction "sigil": counter-rotating segmented rings over a tinted
 * noise field. Hover speeds the rings up and brightens them.
 */
export function createSigilMaterial(shared: SharedUniforms, tint: [number, number, number], seed: number) {
  return new ShaderMaterial({
    vertexShader: planeVertex,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uSize;
      uniform float uHover;
      uniform float uReveal;
      uniform vec3 uColor;
      uniform float uSeed;
      varying vec2 vUv;

      ${noiseGLSL}
      ${revealGLSL}

      void main() {
        vec2 p = (vUv - 0.5) * vec2(uSize.x / uSize.y, 1.0) * 2.0;
        float r = length(p);
        float a = atan(p.y, p.x) / 6.28318 + 0.5;
        float t = uTime * (0.04 + uHover * 0.12);

        float n = fbm(p * 1.8 + uSeed + uTime * 0.03);
        vec3 col = mix(vec3(0.025, 0.03, 0.04), uColor * 0.22, n);

        float rings = 0.0;
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float radius = 0.28 + fi * 0.17;
          float dir = mod(fi, 2.0) * 2.0 - 1.0;
          float segments = 5.0 + fi * 3.0 + floor(uSeed);
          float seg = step(0.42, fract(a * segments + t * (fi + 1.0) * dir + uSeed * 0.1));
          float ring = 1.0 - smoothstep(0.0, 0.012 + fi * 0.002, abs(r - radius));
          rings += ring * mix(0.25, 1.0, seg);
        }
        float core = smoothstep(0.09, 0.0, abs(r - 0.1)) * (0.6 + 0.4 * sin(uTime * 2.0 + uSeed));
        col += uColor * (rings + core) * (0.55 + 0.6 * uHover);

        col *= 0.93 + 0.07 * sin(gl_FragCoord.y * 1.5);
        col += (hash12(gl_FragCoord.xy + fract(uTime) * 50.0) - 0.5) * 0.04;

        float mask = revealMask(vUv, uReveal);
        gl_FragColor = vec4(col, mask);
      }
    `,
    uniforms: {
      uTime: shared.uTime,
      uColor: { value: new Vector3(...tint) },
      uSeed: { value: seed },
    },
    transparent: true,
    depthTest: false,
  })
}

/**
 * Video on a plane: cover-fit, scanlines, and an RGB split + zoom on hover.
 */
export function createVideoMaterial(shared: SharedUniforms, video: HTMLVideoElement) {
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
      varying vec2 vUv;

      ${noiseGLSL}
      ${coverUvGLSL}
      ${revealGLSL}

      void main() {
        vec2 uv = coverUv(vUv, uSize, uTexSize);
        uv = (uv - 0.5) * (1.0 - uHover * 0.06) + 0.5;
        float split = 0.004 + uHover * 0.01;
        vec3 col = vec3(
          texture2D(tMap, uv + vec2(split, 0.0)).r,
          texture2D(tMap, uv).g,
          texture2D(tMap, uv - vec2(split, 0.0)).b
        );
        col *= 0.88 + 0.12 * sin(vUv.y * uSize.y * 1.6);
        col *= mix(0.65, 1.0, uHover);
        col += (hash12(gl_FragCoord.xy + fract(uTime) * 73.0) - 0.5) * 0.05;
        gl_FragColor = vec4(col, revealMask(vUv, uReveal));
      }
    `,
    uniforms: {
      tMap: { value: texture },
      uTexSize: { value: [16, 9] },
      uTime: shared.uTime,
    },
    transparent: true,
    depthTest: false,
  })
  const syncSize = () => (material.uniforms.uTexSize.value = [video.videoWidth || 16, video.videoHeight || 9])
  video.addEventListener('loadedmetadata', syncSize)
  syncSize()
  return material
}
