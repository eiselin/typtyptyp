# Stats & Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add standard WPM calculation, per-key mistake tracking, personal bests on lesson cards, and a My Progress screen.

**Architecture:** Six self-contained tasks in dependency order: i18n keys first (depended on by all UI), then data layer (profiles store), then ExerciseScreen changes, then LessonSelectScreen changes, then the new ProgressScreen, then App routing. No test framework exists — verify each task by running `npm run dev` and checking in browser.

**Tech Stack:** Svelte 4 (most screens), Svelte 5 runes (ExerciseScreen only), localStorage via writable stores, Vite dev server.

---

## Codebase orientation

Before starting, read these files to understand patterns:
- `src/stores/profiles.js` — profile store, `updateProgress()` signature
- `src/screens/ExerciseScreen.svelte` — Svelte 5 runes, `finish()` function at lines ~83-92, `handleKeydown` where `errors++` is called
- `src/screens/LessonSelectScreen.svelte` — topbar structure, lesson card markup
- `src/App.svelte` — screen routing pattern (`{:else if $screen === 'X'}`)
- `src/i18n/en.json` and `src/i18n/nl.json` — i18n key patterns, `{placeholder}` interpolation
- `src/lessons/index.js` — `LESSONS`, `FINGER_VARS`, `getFingerForKey()`

Design spec: `docs/superpowers/specs/2026-03-28-stats-and-feedback-design.md`

---

## Task 1: Add i18n keys

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/nl.json`

- [ ] **Step 1: Add English keys**

In `src/i18n/en.json`, add after the `"lessons.guideAction"` line:

```json
"lessons.progress": "PROGRESS →",
"progress.title": "MY PROGRESS",
"progress.trickiest": "YOUR TRICKIEST KEYS",
"progress.oftenType": "often type {typed} instead",
"progress.noMistakes": "Play some lessons to see your trickiest keys!",
```

- [ ] **Step 2: Add Dutch keys**

In `src/i18n/nl.json`, add after the `"lessons.guideAction"` line:

```json
"lessons.progress": "VOORTGANG →",
"progress.title": "MIJN VOORTGANG",
"progress.trickiest": "JOUW MOEILIJKSTE TOETSEN",
"progress.oftenType": "je typt vaak {typed} in plaats daarvan",
"progress.noMistakes": "Speel wat lessen om je moeilijkste toetsen te zien!",
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/en.json src/i18n/nl.json
git commit -m "feat: add i18n keys for stats and progress screen"
```

---

## Task 2: Extend profiles store — mistake tracking

**Files:**
- Modify: `src/stores/profiles.js`

The profile currently looks like:
```js
{
  id, name, colour, createdAt,
  lessonProgress: { [lessonId]: { stars, bestAccuracy, bestWpm } },
  arcadeProgress: { [groupId]: { highScore, achievedAt } },
}
```

We add `lessonMistakes: { [lessonId]: { [expected]: { [typed]: count } } }`.

- [ ] **Step 1: Add `lessonMistakes: {}` to `createProfile`**

In `src/stores/profiles.js`, find the `createProfile` function. The profile object currently ends with `lessonProgress: {}`. Add `lessonMistakes: {}` on the next line:

```js
const profile = {
  id: crypto.randomUUID(),
  name: trimmed,
  colour: PROFILE_COLOURS[ps.length % PROFILE_COLOURS.length],
  createdAt: Date.now(),
  lessonProgress: {},
  lessonMistakes: {},
}
```

- [ ] **Step 2: Extend `updateProgress` to accept and merge mistakes**

Replace the entire `updateProgress` function with:

```js
export function updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm, mistakes = {} }) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.lessonProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }

    const prevMistakes = p.lessonMistakes?.[lessonId] ?? {}
    const mergedMistakes = { ...prevMistakes }
    for (const [expected, typedMap] of Object.entries(mistakes)) {
      mergedMistakes[expected] ??= {}
      for (const [typed, count] of Object.entries(typedMap)) {
        mergedMistakes[expected][typed] = (mergedMistakes[expected][typed] ?? 0) + count
      }
    }

    const updated = {
      ...p,
      lessonProgress: {
        ...p.lessonProgress,
        [lessonId]: {
          stars:        Math.max(prev.stars,        stars),
          bestAccuracy: Math.max(prev.bestAccuracy, bestAccuracy),
          bestWpm:      Math.max(prev.bestWpm,      bestWpm),
        },
      },
      lessonMistakes: {
        ...(p.lessonMistakes ?? {}),
        [lessonId]: mergedMistakes,
      },
    }
    if (get(activeProfile)?.id === profileId) activeProfile.set(updated)
    return updated
  }))
}
```

- [ ] **Step 3: Verify dev server starts cleanly**

```bash
npm run dev
```

Expected: no console errors. No visual change yet.

- [ ] **Step 4: Commit**

```bash
git add src/stores/profiles.js
git commit -m "feat: add lessonMistakes tracking to profiles store"
```

---

## Task 3: Fix WPM and add mistake collection in ExerciseScreen

**Files:**
- Modify: `src/screens/ExerciseScreen.svelte`

ExerciseScreen uses Svelte 5 runes (`<svelte:options runes={true}>`). State is declared with `$state()`.

- [ ] **Step 1: Add `mistakeLog` state variable**

In the script block, after the existing `let errors = $state(0)` line, add:

```js
let mistakeLog = $state([])
```

- [ ] **Step 2: Reset `mistakeLog` when lesson changes**

Find the `$effect` that resets `cursor`, `errors`, and `startTime` when `lesson` changes (around line 40). Add `mistakeLog = []` to the reset:

```js
$effect(() => {
  if (lesson) {
    sequence = buildExerciseSequence(learnedKeys, newKeys, 200, WORD_LISTS[$lang] ?? WORD_LISTS.nl)
    cursor = 0; errors = 0; startTime = null; scaleMeasured = false; mistakeLog = []
  }
})
```

- [ ] **Step 3: Record mistakes on wrong keypress**

In `handleKeydown`, find the `else` branch where `errors++` is called (around line 73). Add mistake recording:

```js
} else {
  errors++
  mistakeLog = [...mistakeLog, { expected: sequence[cursor], typed: e.key }]
  chick?.trigger('error')
}
```

- [ ] **Step 4: Fix WPM formula and pass mistakes to updateProgress**

Find the `finish()` function. It currently contains:
```js
const wpm = Math.round(sequence.trim().split(' ').length / mins)
```

Replace only that line:
```js
const wpm = Math.round((sequence.length / 5) / mins)
```

Then find the `updateProgress` call:
```js
if ($activeProfile) updateProgress($activeProfile.id, lesson.id, { stars, bestAccuracy: acc, bestWpm: wpm })
```

Replace it with:
```js
if ($activeProfile) {
  const mistakes = {}
  for (const { expected, typed } of mistakeLog) {
    mistakes[expected] ??= {}
    mistakes[expected][typed] = (mistakes[expected][typed] ?? 0) + 1
  }
  updateProgress($activeProfile.id, lesson.id, { stars, bestAccuracy: acc, bestWpm: wpm, mistakes })
}
```

- [ ] **Step 5: Verify in browser**

Run `npm run dev`. Complete a lesson. Check the results screen shows a WPM number. Open browser devtools → Application → Local Storage → `typtyptyp_profiles`. Confirm the profile now has a `lessonMistakes` object with entries after completing a lesson with errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ExerciseScreen.svelte
git commit -m "feat: standard WPM formula and mistake tracking in exercise"
```

---

## Task 4: Show best WPM/accuracy on lesson cards and add Progress button

**Files:**
- Modify: `src/screens/LessonSelectScreen.svelte`

- [ ] **Step 1: Add WPM/accuracy line to done lesson cards**

In `LessonSelectScreen.svelte`, find the `{#if s === 'done'}` block inside the lesson card. Currently it shows:

```svelte
{#if s === 'done'}
  <div class="lstars">{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
```

Replace with:

```svelte
{#if s === 'done'}
  <div class="lstars">{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
  {#if (progress[lesson.id]?.bestWpm ?? 0) > 0}
    <div class="lbest">{progress[lesson.id].bestWpm} WPM · {progress[lesson.id].bestAccuracy}%</div>
  {/if}
```

Add the style for `.lbest` in the `<style>` block:

```css
.lbest { font-size:9px; color:var(--text-muted); letter-spacing:1px; margin-top:2px; }
```

- [ ] **Step 2: Replace subtitle with PROGRESS button in topbar**

Find the topbar in the template. It currently contains three spans/buttons:
```svelte
<button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
<span class="title">...</span>
<span class="sub">{$t('lessons.title')}</span>
```

Replace the `<span class="sub">` with a progress button that only shows when a profile is active:

```svelte
{#if $activeProfile}
  <button class="progress-btn" on:click={() => goTo('progress')}>{$t('lessons.progress')}</button>
{:else}
  <span class="sub">{$t('lessons.title')}</span>
{/if}
```

Add the style for `.progress-btn` in the `<style>` block:

```css
.progress-btn { font-family:inherit; font-size:12px; color:var(--text-muted); background:none; border:none; cursor:pointer; letter-spacing:1px; }
.progress-btn:hover { color:var(--accent-cyan); }
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`. Navigate to lesson select. Completed lessons should show WPM and accuracy below the stars. The topbar should show "PROGRESS →" on the right when a profile is active.

- [ ] **Step 4: Commit**

```bash
git add src/screens/LessonSelectScreen.svelte
git commit -m "feat: show best WPM/accuracy on lesson cards and add progress nav"
```

---

## Task 5: Create ProgressScreen

**Files:**
- Create: `src/screens/ProgressScreen.svelte`

This is a new Svelte 4 style screen (no `<svelte:options runes={true}>`). Use `$:` reactive declarations and `on:click`.

- [ ] **Step 1: Create the file**

Create `src/screens/ProgressScreen.svelte` with the following content:

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { LESSONS, FINGER_VARS, getFingerForKey } from '../lessons/index.js'
  import { selectLesson, goTo } from '../stores/screen.js'

  $: profile       = $activeProfile
  $: lessonMistakes = profile?.lessonMistakes ?? {}
  $: progress      = profile?.lessonProgress  ?? {}

  // Aggregate top-3 trickiest keys across all lessons; exclude space
  $: trickiestKeys = (() => {
    const totals = {}
    for (const lessonData of Object.values(lessonMistakes)) {
      for (const [expected, typedMap] of Object.entries(lessonData)) {
        if (expected === ' ') continue
        totals[expected] ??= { total: 0, typed: {} }
        for (const [typed, count] of Object.entries(typedMap)) {
          totals[expected].total += count
          totals[expected].typed[typed] = (totals[expected].typed[typed] ?? 0) + count
        }
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([key, data]) => {
        const topTyped = Object.entries(data.typed).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '?'
        return { key, topTyped }
      })
  })()

  function lessonState(lesson) {
    if ((progress[lesson.id]?.stars ?? 0) > 0) return 'done'
    if (lesson.id === 1 || (progress[lesson.id - 1]?.stars ?? 0) >= 1) return 'available'
    return 'locked'
  }
</script>

<div class="screen progress">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
    <span class="title">{$t('progress.title')}</span>
  </div>

  <div class="inner">
    <!-- Trickiest keys -->
    <div class="section-label">{$t('progress.trickiest')}</div>
    {#if trickiestKeys.length === 0}
      <div class="no-mistakes">{$t('progress.noMistakes')}</div>
    {:else}
      <div class="key-grid">
        {#each trickiestKeys as { key, topTyped }}
          {@const finger = getFingerForKey(key)}
          {@const color  = finger ? FINGER_VARS[finger] : 'var(--text)'}
          <div class="key-card" style="--kc:{color}">
            <div class="key-char">{key.toUpperCase()}</div>
            <div class="key-label">{$t('progress.oftenType', { typed: topTyped.toUpperCase() })}</div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Lesson list -->
    <div class="section-label section-label--lessons">{$t('lessons.title')}</div>
    <div class="lesson-list">
      {#each LESSONS as lesson}
        {@const s  = lessonState(lesson)}
        {@const lp = progress[lesson.id]}
        <button
          class="lesson-row lesson-row--{s}"
          disabled={s === 'locked'}
          on:click={() => s !== 'locked' && selectLesson(lesson.id)}
        >
          <span class="ll-label">{lesson.group === 'volledig' ? $t('lessons.label.volledig') : lesson.label}</span>
          <span class="ll-stars">
            {#if s === 'done'}{'★'.repeat(lp.stars)}{'☆'.repeat(3 - lp.stars)}
            {:else if s === 'locked'}- - -
            {/if}
          </span>
          <span class="ll-stats">
            {#if (lp?.bestWpm ?? 0) > 0}{lp.bestWpm} WPM · {lp.bestAccuracy}%{/if}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .screen.progress { max-width:560px; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; }
  .back-btn { font-family:inherit; font-size:12px; color:var(--text); background:none; border:none; cursor:pointer; letter-spacing:1px; }
  .title { font-size:13px; color:var(--text); letter-spacing:2px; }

  .inner { padding:14px 18px 24px; }
  .section-label { font-size:11px; color:var(--text-muted); letter-spacing:2px; margin-bottom:10px; }
  .section-label--lessons { margin-top:24px; }

  /* Trickiest keys */
  .no-mistakes { font-size:13px; color:var(--text-muted); letter-spacing:1px; line-height:1.6; }
  .key-grid { display:flex; gap:12px; flex-wrap:wrap; }
  .key-card {
    display:flex; flex-direction:column; align-items:center; gap:8px;
    background:var(--bg-raised); border:2px solid var(--kc);
    border-radius:8px; padding:14px 20px;
    box-shadow:0 0 14px color-mix(in srgb,var(--kc) 25%,transparent);
  }
  .key-char { font-size:40px; font-weight:bold; color:var(--kc); font-family:'Courier New',monospace; line-height:1; text-shadow:0 0 16px var(--kc); }
  .key-label { font-size:10px; color:var(--kc); opacity:.8; letter-spacing:1px; text-align:center; }

  /* Lesson list */
  .lesson-list { display:flex; flex-direction:column; gap:4px; }
  .lesson-row {
    display:flex; align-items:center; gap:10px;
    background:var(--bg-raised); border:1px solid var(--border);
    border-radius:4px; padding:8px 12px;
    font-family:inherit; cursor:pointer; text-align:left; width:100%;
  }
  .lesson-row--done      { border-color:#005533; }
  .lesson-row--available { border-color:var(--accent-cyan); }
  .lesson-row--locked    { opacity:.4; cursor:not-allowed; background:var(--bg-sunken); }
  .ll-label  { font-size:13px; font-weight:bold; color:var(--text); width:80px; }
  .lesson-row--done      .ll-label { color:var(--accent-green); }
  .lesson-row--available .ll-label { color:var(--accent-cyan); }
  .ll-stars  { font-size:11px; color:#ffcc00; letter-spacing:1px; width:52px; }
  .lesson-row--locked .ll-stars { color:var(--text-muted); }
  .ll-stats  { font-size:11px; color:var(--text-muted); margin-left:auto; letter-spacing:1px; }
</style>
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/screens/ProgressScreen.svelte
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProgressScreen.svelte
git commit -m "feat: add ProgressScreen with trickiest keys and lesson list"
```

---

## Task 6: Wire up routing in App.svelte

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Import ProgressScreen**

Add the import after the existing `GameScreen` import line:

```js
import ProgressScreen    from './screens/ProgressScreen.svelte'
```

- [ ] **Step 2: Add route**

Add a new `{:else if}` block after the `game` block (before the closing `{/if}`):

```svelte
{:else if $screen === 'progress'}
  <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
    <ProgressScreen />
  </div>
```

- [ ] **Step 3: Full end-to-end verification**

Run `npm run dev`. Walk through:
1. Select a profile on home screen
2. Go to lesson select — confirm "PROGRESS →" appears in topbar
3. Complete a lesson (deliberately make some mistakes)
4. Go back to lesson select — confirm the done card shows WPM and accuracy
5. Click "PROGRESS →" — confirm Progress screen loads
6. Trickiest keys section should now show keys you mistyped (may need to make multiple mistakes on the same key to see them)
7. Lesson list shows all 15 lessons, completed ones with bests, locked ones dimmed
8. Click a completed lesson row — confirm it navigates straight to the exercise
9. Back button returns to lesson select

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "feat: route progress screen in App"
```
