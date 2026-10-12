import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import { fullscreenVertex, noiseGLSL } from './glsl'
import type { SharedUniforms } from './Stage'

const fragment = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uIntro;
uniform float uVelocity;
uniform vec3 uTint;
varying vec2 vUv;

${noiseGLSL}

void main() {
  vec2 uv = vUv;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime * 0.04;

  // Two rounds of domain warping give the slow "nebula" drift.
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 3.1));
  vec2 r = vec2(
    fbm(p * 1.9 + q * 1.7 + vec2(1.7, 9.2) + uScroll * 0.9),
    fbm(p * 1.9 + q * 1.7 + vec2(8.3, 2.8) - uScroll * 0.6)
  );
  float n = fbm(p * 1.5 + r * 1.3 + uPointer * 0.12);

  vec3 ink = vec3(0.027, 0.035, 0.047);
  vec3 deep = vec3(0.035, 0.12, 0.14);
  vec3 col = mix(ink, deep, smoothstep(0.25, 0.85, n));
  col = mix(col, uTint, pow(smoothstep(0.55, 1.0, n), 3.0) * 0.6);

  // The "signal band": a bright scan line that travels with scroll and
  // brightens with scroll speed.
  float bandY = fract(0.62 - uScroll * 1.6);
  float jitter = fbm(vec2(uv.x * 7.0 - uTime * 0.5, uTime * 0.3));
  float band = exp(-pow((uv.y - bandY) * (38.0 - uVelocity * 20.0), 2.0)) * (0.3 + 0.7 * jitter);
  col += uTint * band * (0.22 + uVelocity * 0.5);

  // CRT-ish scanlines, vignette and film grain.
  col *= 0.95 + 0.05 * sin(gl_FragCoord.y * 1.3);
  float vignette = smoothstep(1.3, 0.2, length(p * vec2(0.85, 1.15)));
  col *= mix(0.5, 1.0, vignette);
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.05;

  // Intro: an iris opens from the centre.
  float iris = smoothstep(uIntro * 1.7 - 0.08, uIntro * 1.7, length(p));
  col = mix(col, ink, iris);

  gl_FragColor = vec4(col, 1.0);
}
`

export function createBackground(shared: SharedUniforms) {
  const material = new ShaderMaterial({
    vertexShader: fullscreenVertex,
    fragmentShader: fragment,
    uniforms: shared,
    depthTest: false,
    depthWrite: false,
  })
  const mesh = new Mesh(new PlaneGeometry(2, 2), material)
  mesh.frustumCulled = false
  return mesh
}
