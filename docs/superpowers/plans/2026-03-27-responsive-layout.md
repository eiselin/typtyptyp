# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix top-clipping on all screens and make the exercise screen scale down to fit any viewport height without scrolling.

**Architecture:** Two isolated changes — a 3-line CSS fix to `body` that unblocks scrolling on all screens, and a scale wrapper added to `ExerciseScreen.svelte` that shrinks the exercise screen proportionally when the window is too short. No existing layout values are touched.

**Tech Stack:** Svelte 5 (runes mode in ExerciseScreen), CSS, Vitest.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app.css` | Modify | Fix body alignment so content is reachable when taller than viewport |
| `src/screens/ExerciseScreen.svelte` | Modify | Add scale-to-fit wrapper + JS resize logic |

---

### Task 1: Fix body alignment in `src/app.css`

**Files:**
- Modify: `src/app.css` (the `body` rule, lines 30–37)

- [ ] **Step 1: Read the current body rule**

Read `src/app.css` lines 30–37 to confirm the current values before editing.

- [ ] **Step 2: Update the body rule**

In `src/app.css`, change the `body` rule from:

```css
body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

To:

```css
body {
  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 16px 8px;
}
```

Changes:
- `min-height: 100vh` → `100dvh` (avoids mobile browser chrome resize jank; harmless on desktop)
- `align-items: center` → `flex-start` (content starts at top — no more top-clipping)
- Add `overflow-y: auto` (content taller than viewport scrolls)
- Add `padding: 16px 8px` (breathing room around cards)

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all 33 tests pass. (These are logic tests, not visual — just confirming no import/compile errors.)

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Open the app. Shrink the browser window vertically until the home screen overflows. Verify:
- Content is scrollable (no top-clipping)
- Screen card is still horizontally centered

- [ ] **Step 5: Commit**

```bash
git add src/app.css
git commit -m "fix: unblock vertical scroll and remove top-clipping on all screens"
```

---

### Task 2: Scale-to-fit in `ExerciseScreen.svelte`

**Files:**
- Modify: `src/screens/ExerciseScreen.svelte`

The exercise screen uses Svelte 5 runes (`$state`, `$derived`, `$effect`). All new code must use runes syntax.

- [ ] **Step 1: Read the current ExerciseScreen.svelte**

Read `src/screens/ExerciseScreen.svelte` to confirm current structure before editing.

- [ ] **Step 2: Add state variables and scale logic to the script block**

**Part A — add the import at the top of the script block.**

The existing imports end at line 12. Add `onMount` and `onDestroy` to the existing svelte import line, or add a new import line immediately after line 12 (before `const FINGER_VARS`):

```js
  import { onMount, onDestroy } from 'svelte'
```

`import` statements must come before all other code in the script block. Do not place this import at the bottom.

**Part B — add state variables, functions, and effects at the end of the script block** (after line 79, before `</script>`):

```js
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

  $effect(() => {
    if (!showIntro && scaleWrap) measureAndScale()
  })

  onMount(() => {
    window.addEventListener('resize', updateScale)
  })

  onDestroy(() => window.removeEventListener('resize', updateScale))
```

Note: `showIntro` is already defined in the script as a `$derived`. The `$effect` fires after the DOM updates when `showIntro` becomes false — at that point `scaleWrap.offsetHeight` reflects the full exercise panel height.

- [ ] **Step 3: Wrap the template in the scale wrapper**

In the template, wrap the existing `<div class="screen exercise">` in a scale wrapper. The `<svelte:window>` stays outside.

Change:

```svelte
<svelte:window onkeydown={handleKeydown} />

<div class="screen exercise">
```

To:

```svelte
<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={scaleWrap}
  style="transform:scale({scale}); transform-origin:top center; margin-bottom:{(scale-1)*naturalH}px; width:100%"
>
<div class="screen exercise">
```

And close the wrapper after the existing closing `</div>` at the end of the template (line 131):

```svelte
</div>
</div>
```

The full template structure after the change:

```svelte
<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={scaleWrap}
  style="transform:scale({scale}); transform-origin:top center; margin-bottom:{(scale-1)*naturalH}px; width:100%"
>
  <div class="screen exercise">
    <div class="topbar">
      ...
    </div>
    {#if showIntro}
      ...
    {:else}
      ...
    {/if}
  </div>
</div>
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all 33 tests pass.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

**Test A — exercise screen scales down:**
1. Navigate to a lesson with new keys (e.g., lesson 2) — the intro panel appears
2. Dismiss the intro by clicking BEGIN
3. Shrink the browser window vertically until it is clearly smaller than the exercise screen
4. Verify the exercise screen shrinks proportionally — keyboard stays fully visible, no scrolling needed
5. Verify the keyboard is not clipped at the bottom (confirms `naturalH` was measured correctly and is not 0)

**Test B — scale = 1 on large windows:**
1. Maximise the browser window
2. Verify the exercise screen looks identical to before (no visible change)

**Test C — other screens still scroll:**
1. Navigate to the home screen
2. Shrink the window until the home card overflows
3. Verify you can scroll to see the full card (no top-clipping)

- [ ] **Step 6: Commit**

```bash
git add src/screens/ExerciseScreen.svelte
git commit -m "feat: scale exercise screen to fit viewport height"
```

---

## Done

After both tasks:
- All screens scroll normally when taller than the viewport — no top-clipping
- Exercise screen scales to fit any desktop viewport height — keyboard always visible
- `npm test` passes with no failures
- No existing layout values were changed
