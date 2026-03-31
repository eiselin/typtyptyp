const NAV_SELECTOR = 'button:not([disabled]):not([tabindex="-1"])'

function navButtons(containerEl) {
  return Array.from(containerEl.querySelectorAll(NAV_SELECTOR))
}

function isEditableEl() {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA'
}

/**
 * Flat arrow-key navigation in reading order.
 * ArrowRight/Down = next; ArrowLeft/Up = previous.
 * Tab/Shift+Tab follow the same pattern.
 */
export function arrowNav(e, containerEl) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return
  if (isEditableEl()) return
  const buttons = navButtons(containerEl)
  if (buttons.length === 0) return
  const idx = buttons.indexOf(document.activeElement)
  const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)
  const next = idx === -1
    ? (forward ? 0 : buttons.length - 1)
    : (forward ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length)
  buttons[next].focus()
  e.preventDefault()
}

/**
 * 2D arrow-key navigation using screen position.
 * Left/Right = previous/next in reading order.
 * Up/Down = nearest button in that direction, preferring closest horizontal position.
 * Tab/Shift+Tab follow the same pattern as Left/Right.
 */
export function arrowNav2D(e, containerEl) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return
  if (isEditableEl()) return
  const buttons = navButtons(containerEl)
  if (buttons.length === 0) return
  const idx = buttons.indexOf(document.activeElement)

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
    const forward = e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)
    const next = idx === -1
      ? (forward ? 0 : buttons.length - 1)
      : (forward ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length)
    buttons[next].focus()
    e.preventDefault()
    return
  }

  if (idx === -1) { buttons[0].focus(); e.preventDefault(); return }

  const cur = document.activeElement
  const curRect = cur.getBoundingClientRect()
  const curMidX = curRect.left + curRect.width / 2
  const curMidY = curRect.top + curRect.height / 2
  const threshold = curRect.height * 0.5
  const forward = e.key === 'ArrowDown'

  const candidates = buttons.filter(btn => {
    if (btn === cur) return false
    const midY = btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2
    return forward ? midY > curMidY + threshold : midY < curMidY - threshold
  })
  if (candidates.length === 0) return

  const targetY = forward
    ? Math.min(...candidates.map(b => b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2))
    : Math.max(...candidates.map(b => b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2))

  const rowBtns = candidates.filter(btn => {
    const midY = btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2
    return Math.abs(midY - targetY) < threshold
  })

  const best = rowBtns.reduce((a, b) => {
    const ax = a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2
    const bx = b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2
    return Math.abs(ax - curMidX) <= Math.abs(bx - curMidX) ? a : b
  })

  best.focus()
  e.preventDefault()
}
