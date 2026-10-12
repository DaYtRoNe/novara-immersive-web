import { Emitter } from './emitter'

type Report = (progress: number) => void

interface Task {
  id: string
  weight: number
  progress: number
  done: boolean
  run: (report: Report) => Promise<unknown>
}

type LoaderEvents = {
  progress: number
  complete: void
  error: { id: string; error: unknown }
}

/**
 * Collects loading tasks from anywhere in the app (fonts, sounds, video,
 * shader warm-up) and reports one weighted progress value for the preloader.
 * A failed task still counts as finished so the site never gets stuck.
 */
class AssetLoader extends Emitter<LoaderEvents> {
  private tasks = new Map<string, Task>()
  private started = false
  progress = 0
  complete = false

  add(id: string, run: Task['run'], weight = 1) {
    if (this.tasks.has(id)) return
    const task: Task = { id, weight, progress: 0, done: false, run }
    this.tasks.set(id, task)
    if (this.started) this.runTask(task)
  }

  start() {
    if (this.started) return
    this.started = true
    if (this.tasks.size === 0) return this.finish()
    this.tasks.forEach((task) => this.runTask(task))
  }

  private async runTask(task: Task) {
    try {
      await task.run((p) => {
        task.progress = Math.min(1, Math.max(task.progress, p))
        this.update()
      })
    } catch (error) {
      this.emit('error', { id: task.id, error })
      console.warn(`[loader] "${task.id}" failed`, error)
    }
    task.progress = 1
    task.done = true
    this.update()
  }

  private update() {
    let total = 0
    let weighted = 0
    this.tasks.forEach((t) => {
      total += t.weight
      weighted += t.progress * t.weight
    })
    this.progress = total ? weighted / total : 1
    this.emit('progress', this.progress)
    if ([...this.tasks.values()].every((t) => t.done)) this.finish()
  }

  private finish() {
    if (this.complete) return
    this.complete = true
    this.progress = 1
    this.emit('progress', 1)
    this.emit('complete', undefined)
  }
}

export const assetLoader = new AssetLoader()

/** Downloads a file with byte-level progress and returns an object URL. */
export async function fetchWithProgress(url: string, report: Report): Promise<string> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length')) || 0
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total) report(received / total)
  }
  const type = res.headers.get('content-type') ?? 'application/octet-stream'
  return URL.createObjectURL(new Blob(chunks as BlobPart[], { type }))
}
