export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** Maps `v` from [inMin, inMax] to [outMin, outMax], optionally clamped. */
export const mapRange = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1, clamped = true) => {
  const t = (v - inMin) / (inMax - inMin)
  return lerp(outMin, outMax, clamped ? clamp(t) : t)
}

/**
 * A value that eases toward a target a little every frame.
 * `ease` is the fraction of the remaining distance covered per 60fps frame,
 * so motion stays the same speed on 120Hz screens.
 */
export class Smoothed {
  current: number
  target: number
  ease: number

  constructor(initial = 0, ease = 0.1) {
    this.current = initial
    this.target = initial
    this.ease = ease
  }

  update(target = this.target, deltaMs = 16.67) {
    this.target = target
    const t = 1 - Math.pow(1 - this.ease, deltaMs / 16.67)
    this.current = lerp(this.current, this.target, t)
    if (Math.abs(this.target - this.current) < 1e-4) this.current = this.target
    return this.current
  }

  snap(value: number) {
    this.current = this.target = value
  }
}
