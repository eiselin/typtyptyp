# Responsive Layout — Design Spec

**Date:** 2026-03-27

---

## Problem

The `body` uses `align-items: center` to vertically center the screen card. When the viewport is shorter than the card, the card overflows at the top and is inaccessible — the page clips rather than scrolls. On the exercise screen, the keyboard is hidden when the browser window is not maximised. On the lesson select screen, content just barely fits.

---

## Goal

- Fix top-clipping on all screens so content is always reachable
- Keep the exercise screen fully visible (keyboard included) at any viewport height, by scaling it down proportionally rather than scrolling

---

## Scope

Desktop/laptop only. Mobile/phone is out of scope.

---

## Architecture

### 1. Body alignment fix — `src/app.css`

Change three properties on `body`:

```css
body {
  /* was: align-items: center */
  align-items: flex-start;
  overflow-y: auto;
  padding: 16px 8px;
}
```

- `align-items: flex-start` — screen cards start at the top; no more top-clipping
- `overflow-y: auto` — content taller than the viewport scrolls normally
- `padding: 16px 8px` — small breathing room around cards on all screens

All screens (Home, LessonSelect, Results) now scroll naturally when content is taller than the viewport. No other changes needed for those screens.

### 2. Scale-to-fit — `src/screens/ExerciseScreen.svelte`

The exercise screen must never require scrolling — the keyboard must always be visible. When the viewport is shorter than the screen's natural height, scale the entire screen down to fit.

**Implementation:**

Wrap the existing `.screen.exercise` div in a scale wrapper:

```svelte
<div bind:this={scaleWrap} style="transform:scale({scale}); transform-origin:top center; margin-bottom:{(scale-1)*naturalH}px; width:100%">
  <div class="screen exercise">
    ...existing content unchanged...
  </div>
</div>
```

Add to `<script>`:

```js
import { onMount, onDestroy } from 'svelte'

let scale = $state(1)
let scaleWrap = $state()
let naturalH = $state(0)

function measureAndScale() {
  if (!scaleWrap) return
  naturalH = scaleWrap.offsetHeight
  updateScale()
}

function updateScale() {
  if (!naturalH) return
  scale = Math.min(1, (window.innerHeight - 32) / naturalH)
}

onMount(() => {
  window.addEventListener('resize', updateScale)
})

onDestroy(() => window.removeEventListener('resize', updateScale))
```

The exercise screen uses Svelte 5 runes. `showIntro` is a `$derived` value — use `$effect` to fire `measureAndScale` after the intro is dismissed and the main exercise panel is rendered:

```js
$effect(() => {
  if (!showIntro && scaleWrap) measureAndScale()
})
```

This ensures `naturalH` always reflects the main exercise layout height, not the intro panel height.

**How it works:**

- `naturalH` is captured after the intro is dismissed and the full exercise layout is rendered
- `scale` is clamped to `[0, 1]` — the screen never grows larger than its natural size on big monitors
- `transform-origin: top center` keeps the screen anchored to the top
- `margin-bottom: (scale - 1) * naturalH` is always ≤ 0 — compensates for the layout space the shrunken element still occupies, preventing a gap below

**The `-32` in `window.innerHeight - 32`** accounts for the `16px` body padding top and bottom (16 + 16 = 32px total).

---

## Files Changed

| File | Change |
|------|--------|
| `src/app.css` | 3-line change to `body`: `align-items`, `overflow-y`, `padding` |
| `src/screens/ExerciseScreen.svelte` | Add scale wrapper div + ~10 lines of JS |

---

## What Does NOT Change

- All screen max-widths, font sizes, paddings, and layout values — untouched
- Home, LessonSelect, Results screens — only benefit from the body fix, no component changes
- The keyboard component and all exercise logic — unchanged

---

## Testing

- Resize browser window to smaller than exercise screen height → screen scales down, keyboard stays visible
- No scroll required on exercise screen at any reasonable desktop height
- Home and lesson screens scroll normally when window is very short
- Full-size window (no scaling needed) → `scale = 1`, no visual change
