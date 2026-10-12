interface WipeControls {
  cover: () => Promise<void>
  uncover: () => Promise<void>
}

let controls: WipeControls | null = null

/** Called once by <TransitionWipe> to expose its animations. */
export function registerWipe(c: WipeControls) {
  controls = c
}

export const pageWipe = {
  cover: () => controls?.cover() ?? Promise.resolve(),
  uncover: () => controls?.uncover() ?? Promise.resolve(),
}
