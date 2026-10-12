// Shared GLSL snippets (written for this project).

/** Hash + value noise + fbm. Cheap, smooth enough for backgrounds. */
export const noiseGLSL = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    sum += amp * valueNoise(p);
    p = rot * p * 2.03 + 11.7;
    amp *= 0.5;
  }
  return sum;
}
`

/** "object-fit: cover" for textures: maps plane UVs into texture UVs. */
export const coverUvGLSL = /* glsl */ `
vec2 coverUv(vec2 uv, vec2 planeSize, vec2 texSize) {
  float planeRatio = planeSize.x / planeSize.y;
  float texRatio = texSize.x / texSize.y;
  vec2 scale = planeRatio > texRatio
    ? vec2(1.0, texRatio / planeRatio)
    : vec2(planeRatio / texRatio, 1.0);
  return (uv - 0.5) * scale + 0.5;
}
`

/** Plain UV pass-through vertex shader for planes. */
export const planeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/** Full-screen triangle-free quad: ignores cameras entirely. */
export const fullscreenVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`
