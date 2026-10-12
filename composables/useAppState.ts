export interface VideoRequest {
  src: string
  title: string
}

/** Global UI state shared by the layout, frame, menu and pages. */
export function useAppState() {
  return {
    /** 0..1 aggregate progress of the asset loader. */
    loadProgress: useState('loadProgress', () => 0),
    /** Assets are loaded (preloader may still be showing). */
    loaded: useState('loaded', () => false),
    /** The visitor has clicked through the preloader. */
    entered: useState('entered', () => false),
    /** Page content is mounted and the transition wipe has finished. */
    pageReady: useState('pageReady', () => false),
    isMuted: useState('isMuted', () => true),
    menuOpen: useState('menuOpen', () => false),
    isScrolling: useState('isScrolling', () => false),
    /** Normalised scroll progress of the current page, 0..1. */
    scrollProgress: useState('scrollProgress', () => 0),
    video: useState<VideoRequest | null>('video', () => null),
  }
}
