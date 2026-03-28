/**
 * Arrow-key navigation among buttons within a container element.
 * ArrowRight/Down = next button; ArrowLeft/Up = previous button.
 * No-ops when an input/textarea has focus (don't steal text navigation).
 */
export function arrowNav(e, containerEl) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  const buttons = Array.from(containerEl.querySelectorAll('button:not([disabled])'))
  if (buttons.length === 0) return
  const idx = buttons.indexOf(document.activeElement)
  const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
  const next = idx === -1
    ? (forward ? 0 : buttons.length - 1)
    : (forward ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length)
  buttons[next].focus()
  e.preventDefault()
}
