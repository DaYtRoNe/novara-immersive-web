import { raf, type FrameInfo } from '~/lib/raf'

/**
 * Runs `callback` every frame while the component is mounted (and while
 * `active` is true, if given). Pauses automatically inside <KeepAlive>.
 */
export function useRaf(callback: (info: FrameInfo) => void, { order = 0, active }: { order?: number; active?: Ref<boolean> } = {}) {
  const running = ref(false)

  const start = () => {
    if (running.value) return
    running.value = true
    raf.add(callback, order)
  }
  const stop = () => {
    if (!running.value) return
    running.value = false
    raf.remove(callback)
  }
  const sync = () => (active === undefined || active.value ? start() : stop())

  onMounted(sync)
  onActivated(sync)
  onDeactivated(stop)
  onBeforeUnmount(stop)
  if (active) watch(active, sync)

  return { running, start, stop }
}
