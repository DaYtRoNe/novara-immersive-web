import { Mesh, PlaneGeometry, ShaderMaterial, type IUniform } from 'three'
import { Smoothed } from '../lerp'

const unitPlane = new PlaneGeometry(1, 1)

export interface DomPlaneOptions {
  el: HTMLElement
  material: ShaderMaterial
}

/**
 * A WebGL plane glued to a DOM element. Every frame it copies the element's
 * on-screen rectangle (which already includes smooth-scroll transforms) into
 * pixel-space coordinates for the orthographic camera.
 *
 * The material may use: uSize (vec2 px), uHover (0..1), uReveal (0..1).
 */
export class DomPlane {
  readonly mesh: Mesh
  readonly el: HTMLElement
  readonly hover = new Smoothed(0, 0.08)
  reveal = 0
  private uniforms: Record<string, IUniform>

  constructor({ el, material }: DomPlaneOptions) {
    this.el = el
    this.mesh = new Mesh(unitPlane, material)
    this.mesh.frustumCulled = false
    this.uniforms = material.uniforms
    this.uniforms.uSize ??= { value: [1, 1] }
    this.uniforms.uHover ??= { value: 0 }
    this.uniforms.uReveal ??= { value: 0 }
  }

  update(viewportW: number, viewportH: number, delta: number) {
    const rect = this.el.getBoundingClientRect()
    const visible = rect.bottom > -50 && rect.top < viewportH + 50 && rect.width > 0 && this.reveal > 0.001
    this.mesh.visible = visible
    if (!visible) return

    this.mesh.position.set(rect.left + rect.width / 2 - viewportW / 2, viewportH / 2 - (rect.top + rect.height / 2), 0)
    this.mesh.scale.set(rect.width, rect.height, 1)

    this.uniforms.uSize.value = [rect.width, rect.height]
    this.uniforms.uHover.value = this.hover.update(undefined, delta)
    this.uniforms.uReveal.value = this.reveal
  }

  dispose() {
    this.mesh.removeFromParent()
    ;(this.mesh.material as ShaderMaterial).dispose()
  }
}
