/**
 * Tracks pointer hover on an element. Keyboard focus counts as hover too,
 * so focus states get the same animations and sounds.
 */
export function useHover(el: Ref<HTMLElement | { $el: HTMLElement } | null>) {
  const hovering = ref(false)
  const on = () => (hovering.value = true)
  const off = () => (hovering.value = false)
  let target: HTMLElement | null = null

  const resolve = () => {
    const v = el.value
    return v && '$el' in v ? v.$el : (v as HTMLElement | null)
  }

  onMounted(() => {
    target = resolve()
    if (!target) return
    target.addEventListener('pointerenter', on)
    target.addEventListener('pointerleave', off)
    target.addEventListener('focusin', on)
    target.addEventListener('focusout', off)
  })
  onBeforeUnmount(() => {
    if (!target) return
    target.removeEventListener('pointerenter', on)
    target.removeEventListener('pointerleave', off)
    target.removeEventListener('focusin', on)
    target.removeEventListener('focusout', off)
  })

  return hovering
}
