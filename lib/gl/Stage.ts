import { OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer, type IUniform } from 'three'
import { createBackground } from './Background'
import { createShards } from './Shards'
import type { DomPlane } from './DomPlane'
import { Smoothed, clamp } from '../lerp'
import { raf, RAF_ORDER, type FrameInfo } from '../raf'
import { scroll } from '../scroll'
import { device } from '../device'

export interface SharedUniforms {
  [name: string]: IUniform
  uTime: IUniform<number>
  uResolution: IUniform<Vector2>
  uPointer: IUniform<Vector2>
  uScroll: IUniform<number>
  uVelocity: IUniform<number>
  uIntro: IUniform<number>
  uTint: IUniform<Vector3>
}

/**
 * Values that page timelines animate (plain numbers so GSAP can tween them).
 * The stage eases toward them every frame.
 */
export interface StageState {
  intro: number
  formation: number
  cameraZ: number
  tintR: number
  tintG: number
  tintB: number
}

/**
 * One fixed full-screen canvas for the whole site, rendered in three passes:
 *  1. background: full-screen noise shader
 *  2. world:      perspective scene (wireframe shards)
 *  3. dom:        orthographic, pixel-space planes glued to DOM elements
 */
export class Stage {
  readonly renderer: WebGLRenderer
  readonly shared: SharedUniforms
  readonly state: StageState = { intro: 0, formation: 0, cameraZ: 6, tintR: 1, tintG: 0.35, tintB: 0.12 }

  private bgScene = new Scene()
  private worldScene = new Scene()
  private domScene = new Scene()
  private persp: PerspectiveCamera
  private ortho: OrthographicCamera
  private shards: ReturnType<typeof createShards>
  private planes = new Set<DomPlane>()

  private pointerX = new Smoothed(0, 0.05)
  private pointerY = new Smoothed(0, 0.05)
  private formation = new Smoothed(0, 0.06)
  private cameraZ = new Smoothed(6, 0.06)
  private tint = [new Smoothed(1, 0.04), new Smoothed(0.35, 0.04), new Smoothed(0.12, 0.04)]
  private velocity = new Smoothed(0, 0.1)
  private width = 1
  private height = 1
  private paused = false

  constructor(container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, device.isMobile ? 1 : 1.5))
    this.renderer.autoClear = false
    this.renderer.setClearColor(0x07090c, 1)
    container.appendChild(this.renderer.domElement)

    this.shared = {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2() },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uIntro: { value: 0 },
      uTint: { value: new Vector3(1, 0.35, 0.12) },
    }

    this.persp = new PerspectiveCamera(32, 1, 0.1, 50)
    this.ortho = new OrthographicCamera(-1, 1, 1, -1, -1000, 1000)

    this.bgScene.add(createBackground(this.shared))
    this.shards = createShards(this.shared, device.isMobile ? 36 : 72)
    this.worldScene.add(this.shards.mesh)

    window.addEventListener('resize', this.resize)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
    raf.add(this.tick, RAF_ORDER.render)
  }

  addPlane(plane: DomPlane) {
    this.planes.add(plane)
    this.domScene.add(plane.mesh)
  }

  removePlane(plane: DomPlane) {
    this.planes.delete(plane)
    plane.dispose()
  }

  /** Compile every shader up front so the first scroll doesn't stutter. */
  warmUp() {
    this.renderer.compile(this.bgScene, this.ortho)
    this.renderer.compile(this.worldScene, this.persp)
    this.renderer.compile(this.domScene, this.ortho)
  }

  private onPointer = (e: PointerEvent) => {
    this.pointerX.target = (e.clientX / this.width) * 2 - 1
    this.pointerY.target = -((e.clientY / this.height) * 2 - 1)
  }

  private onVisibility = () => {
    this.paused = document.hidden
  }

  private resize = () => {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.renderer.setSize(this.width, this.height)
    this.shared.uResolution.value.set(this.width * this.renderer.getPixelRatio(), this.height * this.renderer.getPixelRatio())

    this.persp.aspect = this.width / this.height
    // Narrow screens: widen the view so the halo still fits.
    this.persp.fov = this.persp.aspect < 1 ? 48 : 32
    this.persp.updateProjectionMatrix()

    // Pixel-space ortho camera: 1 unit = 1 CSS pixel, origin at screen centre.
    Object.assign(this.ortho, { left: -this.width / 2, right: this.width / 2, top: this.height / 2, bottom: -this.height / 2 })
    this.ortho.updateProjectionMatrix()
  }

  private tick = ({ time, delta }: FrameInfo) => {
    if (this.paused) return
    const s = this.shared
    s.uTime.value = time
    s.uIntro.value = this.state.intro
    s.uScroll.value = scroll.top() / Math.max(this.height, 1)
    s.uVelocity.value = this.velocity.update(clamp(Math.abs(scroll.velocity()) / 4000), delta)
    s.uPointer.value.set(this.pointerX.update(undefined, delta), this.pointerY.update(undefined, delta))
    s.uTint.value.set(
      this.tint[0].update(this.state.tintR, delta),
      this.tint[1].update(this.state.tintG, delta),
      this.tint[2].update(this.state.tintB, delta),
    )
    this.shards.material.uniforms.uFormation.value = this.formation.update(this.state.formation, delta)

    // Camera drifts with the pointer for parallax; z comes from the page timeline.
    const p = s.uPointer.value
    this.persp.position.set(p.x * 0.35, p.y * 0.2, this.cameraZ.update(this.state.cameraZ, delta))
    this.persp.lookAt(0, 0, -2)
    this.shards.mesh.rotation.z = time * 0.02

    for (const plane of this.planes) plane.update(this.width, this.height, delta)

    const r = this.renderer
    r.clear()
    r.render(this.bgScene, this.ortho)
    r.render(this.worldScene, this.persp)
    if (this.planes.size) r.render(this.domScene, this.ortho)
  }

  dispose() {
    raf.remove(this.tick)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointermove', this.onPointer)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.planes.forEach((p) => p.dispose())
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

let instance: Stage | null = null

export const stageRegistry = {
  create(container: HTMLElement) {
    instance ??= new Stage(container)
    return instance
  },
  get() {
    return instance
  },
  destroy() {
    instance?.dispose()
    instance = null
  },
}
