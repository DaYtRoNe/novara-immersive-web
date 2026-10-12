import { scroll } from '~/lib/scroll'

/**
 * Navigation that understands "/#section" links: on the same page it
 * smooth-scrolls; from another page it navigates, then scrolls after the
 * page transition.
 */
export function useSiteNav() {
  const route = useRoute()
  const pendingHash = useState<string | null>('pendingHash', () => null)

  function go(to: string) {
    const [path, hash] = to.split('#')
    const targetPath = path || '/'
    if (hash && route.path === targetPath) {
      scroll.to(`#${hash}`)
      return
    }
    pendingHash.value = hash ? `#${hash}` : null
    return navigateTo(targetPath)
  }

  /** Called by pages once they're ready, to finish a cross-page hash jump. */
  function consumePendingHash() {
    if (!pendingHash.value) return
    const hash = pendingHash.value
    pendingHash.value = null
    nextTick(() => scroll.to(hash))
  }

  const isActive = (to: string) => {
    const [path, hash] = to.split('#')
    return !hash && route.path === (path || '/')
  }

  return { go, consumePendingHash, isActive }
}
