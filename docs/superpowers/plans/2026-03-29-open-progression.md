# Open Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all lesson/game unlock gates; replace with a three-state tile system (completed/recommended/unplayed) driven by a shared recommendation algorithm used by both the lesson select and coach screens.

**Architecture:** A pure `getRecommendedLesson(profile, lessons)` function is added to `src/lessons/index.js` and imported by both screens. `LessonSelectScreen` replaces its `state()`/`isArcadeUnlocked()` logic with the three-state system; `ProgressScreen` replaces its ad-hoc worstKey lookup. Game tiles are always enabled.

**Tech Stack:** Svelte 4, Vitest, vanilla CSS custom properties.

---

## File Map

| File | Change |
|---|---|
| `src/lessons/index.js` | Add `export function getRecommendedLesson(profile, lessons)` |
| `src/screens/LessonSelectScreen.svelte` | Replace `state()`/`isArcadeUnlocked()`/`unlockAll` with 3-state system; always-enabled games; new CSS |
| `src/screens/ProgressScreen.svelte` | Replace `practiceLesson` lookup with `getRecommendedLesson` |
| `tests/lessons/lessons.test.js` | Add `describe('getRecommendedLesson', ...)` suite |

---

### Task 1: Export `getRecommendedLesson` from `src/lessons/index.js`

**Files:**
- Modify: `src/lessons/index.js`
- Test: `tests/lessons/lessons.test.js`

The function implements four steps in order:

1. **No data** — `keyStats` is empty or no key has ≥5 presses → return `lessons[0]`
2. **Struggling key** — scan lessons in order; for each lesson compute `newKeys` as `getLearnedKeys(lesson.id)` minus `getLearnedKeys(prevLesson.id)` (or empty set for lesson 1). If any newKey has ≥5 presses and accuracy < 0.95, return that lesson immediately.
3. **First unplayed** — return the first lesson with 0 stars
4. **All played** — return the lesson with lowest `bestAccuracy`

- [ ] **Step 1: Write the failing tests**

Add this describe block to `tests/lessons/lessons.test.js`:

```js
import { LESSONS, FINGER_MAP, getLearnedKeys, getFingerForKey, getRecommendedLesson } from '../../src/lessons/index.js'

// ... existing describe blocks unchanged ...

describe('getRecommendedLesson', () => {
  const emptyProfile = { lessonProgress: {}, keyStats: {} }

  // Step 1: no data
  it('returns lesson 1 when keyStats is empty', () => {
    expect(getRecommendedLesson(emptyProfile, LESSONS)).toBe(LESSONS[0])
  })

  it('returns lesson 1 when no key has 5+ presses', () => {
    const profile = {
      lessonProgress: {},
      keyStats: { f: [true, true, true] },
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[0])
  })

  // Step 2: struggling key
  it('returns lesson 1 when f (introduced in L1) is struggling', () => {
    const profile = {
      lessonProgress: { 1: { stars: 1, bestAccuracy: 90, bestWpm: 10 } },
      keyStats: { f: Array(10).fill(false) }, // 0% accuracy
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[0])
  })

  it('returns lesson 2 when d (introduced in L2) is struggling, not f', () => {
    const profile = {
      lessonProgress: {},
      keyStats: {
        f: Array(10).fill(true),       // 100% — fine
        j: Array(10).fill(true),
        d: [...Array(8).fill(true), false, false], // ~80% — struggling
        k: Array(10).fill(true),
      },
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  it('does not flag a key with exactly 0.95 accuracy as struggling', () => {
    // 19/20 = 0.95 — not < 0.95, so step 2 skips it
    const profile = {
      lessonProgress: {
        1: { stars: 1, bestAccuracy: 95, bestWpm: 15 },
        2: { stars: 0, bestAccuracy: 0, bestWpm: 0 },
      },
      keyStats: {
        f: [...Array(19).fill(true), false], // exactly 0.95
      },
    }
    // step 2 finds no struggling key → step 3 returns lesson 2 (first unplayed)
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  it('skips a key with fewer than 5 presses in step 2', () => {
    const profile = {
      lessonProgress: {
        1: { stars: 1, bestAccuracy: 90, bestWpm: 10 },
      },
      keyStats: {
        f: [false, false, false, false], // 4 presses only — skipped
      },
    }
    // step 2 skips f (< 5 presses) → step 3 returns lesson 2 (first unplayed)
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  // Step 3: first unplayed
  it('returns the first unplayed lesson when no key is struggling', () => {
    const profile = {
      lessonProgress: {
        1: { stars: 2, bestAccuracy: 98, bestWpm: 20 },
        2: { stars: 1, bestAccuracy: 96, bestWpm: 15 },
      },
      keyStats: {
        f: Array(10).fill(true),
        j: Array(10).fill(true),
        d: Array(10).fill(true),
        k: Array(10).fill(true),
      },
    }
    // lessons 1 and 2 done, lesson 3 is first unplayed
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[2])
  })

  // Step 4: all played, return lowest bestAccuracy
  it('returns lesson with lowest bestAccuracy when all lessons are played', () => {
    const lessonProgress = {}
    for (const lesson of LESSONS) {
      lessonProgress[lesson.id] = { stars: 1, bestAccuracy: 90, bestWpm: 10 }
    }
    lessonProgress[3].bestAccuracy = 70 // lesson 3 is worst

    const keyStats = {}
    for (const key of 'fjasdkl'.split('')) {
      keyStats[key] = Array(10).fill(true)
    }

    const profile = { lessonProgress, keyStats }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[2]) // lesson 3 = index 2
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/lessons/lessons.test.js
```
Expected: FAIL with `getRecommendedLesson is not a function`

- [ ] **Step 3: Implement `getRecommendedLesson` in `src/lessons/index.js`**

Add after `getFingerForKey`:

```js
/**
 * Returns the single recommended lesson for the given profile.
 * Steps (in order):
 *   1. No data yet → lessons[0]
 *   2. Lowest lesson with a struggling newly-introduced key (accuracy < 0.95, ≥5 presses)
 *   3. Lowest unplayed lesson (0 stars)
 *   4. Lesson with lowest bestAccuracy (most room to improve)
 */
export function getRecommendedLesson(profile, lessons) {
  const lessonProgress = profile?.lessonProgress ?? {}
  const keyStats = profile?.keyStats ?? {}

  // Step 1: No data yet
  const hasData = Object.values(keyStats).some(arr => Array.isArray(arr) && arr.length >= 5)
  if (!hasData) return lessons[0]

  // Step 2: Lowest lesson with a struggling key
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    const prevId = i > 0 ? lessons[i - 1].id : 0
    const currentKeys = new Set(getLearnedKeys(lesson.id))
    const prevKeys = new Set(getLearnedKeys(prevId))
    const newKeys = [...currentKeys].filter(k => !prevKeys.has(k))

    for (const key of newKeys) {
      const results = keyStats[key]
      if (!results || results.length < 5) continue
      const accuracy = results.filter(Boolean).length / results.length
      if (accuracy < 0.95) return lesson
    }
  }

  // Step 3: First unplayed lesson
  for (const lesson of lessons) {
    if ((lessonProgress[lesson.id]?.stars ?? 0) === 0) return lesson
  }

  // Step 4: Lesson with lowest bestAccuracy
  return lessons.reduce((worst, lesson) => {
    const acc = lessonProgress[lesson.id]?.bestAccuracy ?? 0
    const worstAcc = lessonProgress[worst.id]?.bestAccuracy ?? 0
    return acc < worstAcc ? lesson : worst
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/lessons/lessons.test.js
```
Expected: all tests PASS (existing + new getRecommendedLesson suite)

- [ ] **Step 5: Commit**

```bash
git add src/lessons/index.js tests/lessons/lessons.test.js
git commit -m "feat: add getRecommendedLesson to lessons/index.js"
```

---

### Task 2: Update `LessonSelectScreen.svelte` with three-state tile system

**Files:**
- Modify: `src/screens/LessonSelectScreen.svelte`

**Changes:**
- Import `getRecommendedLesson` from lessons/index.js
- Remove `unlockAll` const, `state()` function, `isArcadeUnlocked()` function
- Add reactive `$: recommendedId = getRecommendedLesson($activeProfile ?? emptyProfile, LESSONS)?.id`
- Replace `state()` with inline tile state: `completed` / `recommended` / `unplayed`
- Remove `disabled={s === 'locked'}` — tiles always enabled
- Game tiles: always enabled, always apply `game-tile--unlocked` class
- Update `onMount` focus: look for `.ltile--recommended` first, then `.ltile--completed`, then any button
- CSS: rename/replace `ltile--done`→`ltile--completed`, `ltile--available`→remove, `ltile--locked`→remove; add `ltile--recommended` (neon yellow); change `ltile--unplayed` to dim/neutral

- [ ] **Step 1: Replace script section**

Replace the entire `<script>` block in `LessonSelectScreen.svelte`:

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { LESSONS, getRecommendedLesson } from '../lessons/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'
  import { arrowNav2D } from '../utils/keyboard.js'
  import { onMount } from 'svelte'
  import ProfessorChick from '../components/ProfessorChick.svelte'

  let screenEl

  onMount(() => {
    const first = screenEl?.querySelector('.ltile--recommended')
      ?? screenEl?.querySelector('.ltile--completed')
      ?? screenEl?.querySelector('button:not([disabled])')
    first?.focus()
  })

  const emptyProfile = { lessonProgress: {}, keyStats: {} }

  $: progress = $activeProfile?.lessonProgress ?? {}
  $: recommendedId = getRecommendedLesson($activeProfile ?? emptyProfile, LESSONS)?.id

  function tileState(lesson) {
    if ((progress[lesson.id]?.stars ?? 0) >= 1) return 'completed'
    if (lesson.id === recommendedId) return 'recommended'
    return 'unplayed'
  }

  function dots(stars) {
    return '●'.repeat(stars) + '○'.repeat(3 - stars)
  }

  const GROUPS = ['thuisrij','bovenrij','onderrij','volledig']

  const GROUP_IDS = {
    thuisrij: 'home',
    bovenrij: 'top',
    onderrij: 'bottom',
    volledig:  'all',
  }
</script>
```

- [ ] **Step 2: Replace template lesson tiles section**

Replace the entire `{#each GROUPS as group}…{/each}` block (lines 89–127 in the current file, including the `{@const unlocked = isArcadeUnlocked(groupId)}` line and the old game-tile with `disabled={!unlocked}`) with:

```svelte
{#each GROUPS as group}
  {@const groupId = GROUP_IDS[group]}
  {@const groupLessons = LESSONS.filter(l => l.group === group)}

  <div class="group-lbl">{$t(`lessons.group.${group}`)}</div>

  <div class="lesson-row">
    {#each groupLessons as lesson}
      {@const s = tileState(lesson)}
      {@const stars = progress[lesson.id]?.stars ?? 0}
      {@const wide = lesson.keys.length >= 8}
      <button
        class="ltile ltile--{s}"
        class:ltile--wide={wide}
        on:click={() => selectLesson(lesson.id)}
      >
        <div class="lkeys">{lesson.group === 'volledig' ? $t('lessons.label.volledig') : lesson.label}</div>
        <div class="lstate">
          {#if s === 'completed'}{dots(stars)}
          {:else if s === 'recommended'}NEXT
          {:else}·{/if}
        </div>
      </button>
    {/each}

    <!-- Game tile: always available -->
    <button
      class="game-tile game-tile--unlocked"
      on:click={() => startArcade(groupId)}
    >
      <div class="game-icon">▶▶</div>
      <div class="game-lbl">GAME</div>
    </button>
  </div>
{/each}
```

- [ ] **Step 3: Replace CSS for tile states**

In the `<style>` block, replace everything from `/* ── Lesson tiles ── */` down through the end of the game tile styles:

```css
/* ── Lesson tiles ── */
.ltile {
  flex: 1;
  background: var(--bg-raised);
  border: 1.5px solid var(--border);
  border-radius: 7px;
  padding: 11px 6px;
  text-align: center;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 58px;
}
.ltile--wide { flex: 2; }

.ltile--completed {
  border-color: color-mix(in srgb,var(--accent-green) 30%,var(--border));
}
.ltile--completed .lkeys  { color: var(--accent-green); }
.ltile--completed .lstate { color: color-mix(in srgb,var(--accent-green) 40%,transparent); }

.ltile--recommended {
  border-color: var(--accent-yellow);
  box-shadow: 0 0 10px color-mix(in srgb,var(--accent-yellow) 30%,transparent);
}
.ltile--recommended .lkeys  { color: var(--accent-yellow); }
.ltile--recommended .lstate {
  color: var(--accent-yellow);
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 8px color-mix(in srgb,var(--accent-yellow) 60%,transparent);
}

.ltile--unplayed {
  border-color: var(--border);
  opacity: 0.45;
}
.ltile--unplayed .lkeys  { color: var(--text-muted); }
.ltile--unplayed .lstate { color: var(--border); }

.lkeys  { font-size: 18px; font-weight: bold; letter-spacing: 1px; color: var(--text); }
.lstate { font-size: 15px; letter-spacing: 1px; }

/* ── Game tile ── */
.game-tile {
  width: 64px;
  flex-shrink: 0;
  background: var(--bg-raised);
  border: 1.5px solid var(--border);
  border-radius: 7px;
  padding: 11px 6px;
  text-align: center;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 58px;
  cursor: pointer;
}
.game-tile--unlocked {
  opacity: 1;
  border-color: color-mix(in srgb,var(--accent-yellow) 40%,var(--border));
  box-shadow: 0 0 8px color-mix(in srgb,var(--accent-yellow) 10%,transparent);
}
.game-tile--unlocked:hover {
  border-color: var(--accent-yellow);
  box-shadow: 0 0 14px color-mix(in srgb,var(--accent-yellow) 25%,transparent);
}
.game-icon { font-size: 17px; color: var(--accent-yellow); }
.game-lbl  { font-size: 14px; letter-spacing: 1px; color: var(--accent-yellow); opacity: 0.7; }
```

- [ ] **Step 4: Manually verify in browser**

Check that:
- Exactly one tile has yellow glow and "NEXT" label
- Completed tiles are green with star dots
- Unplayed tiles are dim/neutral
- All game tiles are enabled (yellow border, clickable)
- No `?unlock` param is needed (everything is already playable)

- [ ] **Step 5: Commit**

```bash
git add src/screens/LessonSelectScreen.svelte
git commit -m "feat: replace lock/unlock tiles with completed/recommended/unplayed states"
```

---

### Task 3: Update `ProgressScreen.svelte` to use `getRecommendedLesson`

**Files:**
- Modify: `src/screens/ProgressScreen.svelte`

**Change:** Replace the `practiceLesson` reactive declaration with `getRecommendedLesson`. The practice button will always show when a profile is active (the function always returns a lesson).

- [ ] **Step 1: Update the import line**

In `ProgressScreen.svelte`, change:

```js
import { LESSONS, FINGER_VARS, getFingerForKey, getLearnedKeys } from '../lessons/index.js'
```

to:

```js
import { LESSONS, FINGER_VARS, getFingerForKey, getLearnedKeys, getRecommendedLesson } from '../lessons/index.js'
```

- [ ] **Step 2: Replace the practiceLesson reactive declaration**

Replace:
```js
$: practiceLesson = worstKey
  ? LESSONS.find(l => l.keys.includes(worstKey.key)) ?? null
  : null
```

With:
```js
$: practiceLesson = profile ? getRecommendedLesson(profile, LESSONS) : null
```

- [ ] **Step 3: Manually verify in browser**

Check that:
- Coach screen practice button shows the same lesson as the "NEXT" tile on the lesson select screen
- The practice button always appears when a profile is active (even before any lessons are played, pointing to lesson 1)

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProgressScreen.svelte
git commit -m "feat: coach practice button uses getRecommendedLesson"
```

---

### Task 4: Run full test suite

- [ ] **Step 1: Run all tests**

```
npx vitest run
```

Expected: all tests pass. Known pre-existing failure: `tests/i18n/i18n.test.js` "supports interpolation with uppercased value" — this is a pre-existing ordering issue unrelated to this feature.

- [ ] **Step 2: Confirm no regressions**

All tests other than the pre-existing i18n failure should be green.
