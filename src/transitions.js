export const WIPE_MS = 180
const STEPS = 8

export function wipe(node, { delay = 0 } = {}) {
  return {
    duration: WIPE_MS,
    delay,
    css: (t) => {
      const tq = Math.round(t * STEPS) / STEPS
      return `clip-path: inset(0 ${Math.round((1 - tq) * 100)}% 0 0)`
    }
  }
}
