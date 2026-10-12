import {
  AdditiveBlending,
  BufferAttribute,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  ShaderMaterial,
} from 'three'
import type { SharedUniforms } from './Stage'

const vertex = /* glsl */ `
attribute vec3 aBary;
attribute vec3 aScatter;
attribute vec3 aHalo;
attribute vec4 aSpin; // xyz: angular speed, w: scale

uniform float uTime;
uniform float uFormation;

varying vec3 vBary;
varying float vDepth;
varying float vSeed;

mat3 rotation(vec3 a) {
  vec3 s = sin(a), c = cos(a);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, c.x, s.x, 0.0, -s.x, c.x);
  mat3 ry = mat3(c.y, 0.0, -s.y, 0.0, 1.0, 0.0, s.y, 0.0, c.y);
  mat3 rz = mat3(c.z, s.z, 0.0, -s.z, c.z, 0.0, 0.0, 0.0, 1.0);
  return rz * ry * rx;
}

void main() {
  float f = smoothstep(0.0, 1.0, uFormation);
  // Spin slows down as the shards lock into the halo.
  vec3 angles = aSpin.xyz * (uTime * mix(1.0, 0.2, f) + 10.0);
  vec3 local = rotation(angles) * (position * aSpin.w);
  vec3 base = mix(aScatter, aHalo, f);

  vec4 mv = modelViewMatrix * vec4(base + local, 1.0);
  vBary = aBary;
  vDepth = -mv.z;
  vSeed = aSpin.w * 13.7 + aScatter.x;
  gl_Position = projectionMatrix * mv;
}
`

const fragment = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform vec3 uTint;

varying vec3 vBary;
varying float vDepth;
varying float vSeed;

void main() {
  // Distance to the nearest triangle edge, from barycentric coordinates.
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float line = 1.0 - smoothstep(0.0, 0.03, edge);
  float fill = 0.05;
  float flicker = 0.7 + 0.3 * sin(uTime * 5.0 + vSeed * 40.0);
  float fog = smoothstep(12.0, 3.5, vDepth);

  vec3 bone = vec3(0.95, 0.93, 0.88);
  vec3 col = mix(bone, uTint, 0.5 + 0.5 * sin(vSeed * 3.0));
  float alpha = (line * 0.85 + fill) * fog * flicker * uIntro;
  // AdditiveBlending multiplies by alpha itself, so colour stays straight.
  gl_FragColor = vec4(col, alpha);
}
`

/** A field of wireframe triangles that can morph into a tilted halo ring. */
export function createShards(shared: SharedUniforms, count = 70) {
  const geometry = new InstancedBufferGeometry()
  // One equilateral-ish triangle; per-vertex barycentric coords draw its edges.
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0.6, 0, -0.52, -0.3, 0, 0.52, -0.3, 0], 3))
  geometry.setAttribute('aBary', new BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), 3))

  const scatter = new Float32Array(count * 3)
  const halo = new Float32Array(count * 3)
  const spin = new Float32Array(count * 4)
  const rand = mulberry32(42)
  const tilt = 0.45

  for (let i = 0; i < count; i++) {
    scatter.set([(rand() - 0.5) * 9, (rand() - 0.5) * 5.5, -rand() * 7 + 0.5], i * 3)

    const a = (i / count) * Math.PI * 2
    const r = 2.1 + (rand() - 0.5) * 0.35
    const y = Math.sin(a) * r
    halo.set([Math.cos(a) * r, y * Math.cos(tilt), -2.5 + y * Math.sin(tilt)], i * 3)

    spin.set([(rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.6, 0.12 + rand() * 0.3], i * 4)
  }

  geometry.setAttribute('aScatter', new InstancedBufferAttribute(scatter, 3))
  geometry.setAttribute('aHalo', new InstancedBufferAttribute(halo, 3))
  geometry.setAttribute('aSpin', new InstancedBufferAttribute(spin, 4))
  geometry.instanceCount = count

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      ...shared,
      uFormation: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  return { mesh, material }
}

/** Small seeded PRNG so the layout is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
