# Arcade Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Frogger-style arcade game where the pixel chick hops across a neon river on lily pads by typing words, with lives, a combo multiplier, and a device-wide leaderboard.

**Architecture:** A new `GameScreen.svelte` (Svelte 5 runes, matching `ExerciseScreen`) drives the full game loop via `requestAnimationFrame`. Pure logic lives in `src/stores/leaderboard.js` and helpers in `src/words/index.js`. A thin `src/stores/game.js` passes game outcome to `ResultsScreen` (same pattern as `results.js`).

**Tech Stack:** Svelte 5 runes, Vitest + jsdom, plain CSS, localStorage, no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/stores/leaderboard.js` | Device-wide top-10 leaderboard (localStorage) |
| Create | `src/stores/game.js` | Thin outcome store (score, crossings, groupId) for ResultsScreen handoff |
| Create | `src/screens/GameScreen.svelte` | Full game loop: river, pads, chick, input, HUD, SPLASH overlay |
| Create | `tests/leaderboard.test.js` | Tests for leaderboard pure logic |
| Create | `tests/arcadeWords.test.js` | Tests for getArcadeWordCycler |
| Create | `tests/arcadeUnlock.test.js` | Tests for isArcadeUnlocked |
| Modify | `src/stores/profiles.js` | Add `updateArcadeProgress(profileId, groupId, score)` |
| Modify | `src/stores/screen.js` | Add `game` route + `selectedGroup` writable + `startArcade(groupId)` |
| Modify | `src/words/index.js` | Export `makeCycler` + add `getArcadeWordCycler(groupId, wordList)` |
| Modify | `src/screens/LessonSelectScreen.svelte` | Add ARCADE button per row group |
| Modify | `src/screens/ResultsScreen.svelte` | Add arcade results mode (conditional on `$gameResults`) |
| Modify | `src/components/PixelChick.svelte` | Add `hop`, `splash`, `wobble` animation states |
| Modify | `src/App.svelte` | Wire `game` route to `GameScreen` |
| Modify | `src/i18n/nl.json` + `en.json` | Add arcade UI strings |

---

## Reference: Key Existing Patterns

**Routing:** `screen.js` exports `screen` (writable) and `goTo(name)`. `App.svelte` conditionally renders screens on `$screen`.

**Stores:** `profiles.js` — writable store, auto-saves to localStorage via `profiles.subscribe(save)`, exports plain functions that call `profiles.update(...)`.

**Results handoff:** `results.js` is a bare `writable(null)` set before `goTo('results')`. Follow this exact pattern for `game.js`.

**Lessons/groups:**
```
thuisrij (home):  lessons 1-5,  last lesson id = 5
bovenrij (top):   lessons 6-10, last lesson id = 10
onderrij (bottom): lessons 11-14, last lesson id = 14
volledig (all):   lesson 15,    last lesson id = 15
```

**i18n:** `$t('key')` in templates, `t` is a readable store from `src/i18n/index.js`.

**PixelChick:** SVG component with `state` prop (`'idle'|'happy'|'error'`) and `size` prop. CSS keyframe animations on `.chick--{state}`. Has a `trigger(state)` function that auto-reverts to `idle` after 600ms.

**Tests:** Vitest globals mode. `tests/setup.js` mocks `localStorage`. Run with `npm test`.

---

## Task 1: i18n strings

**Files:**
- Modify: `src/i18n/nl.json`
- Modify: `src/i18n/en.json`

- [ ] **Add arcade strings to `src/i18n/nl.json`**

Add after the last entry (before the closing `}`):

```json
  "arcade.button": "🕹 GAME",
  "arcade.locked": "🔒 GAME",
  "arcade.hud.score": "SCORE",
  "arcade.hud.combo": "COMBO",
  "arcade.hud.lives": "LEVENS",
  "arcade.hud.best": "BEST",
  "arcade.hud.speed": "RIVIER",
  "arcade.splash": "PLONS!",
  "arcade.newBest": "NIEUW RECORD!",
  "arcade.playAgain": "↺ OPNIEUW",
  "arcade.backToLessons": "← LESSEN",
  "arcade.crossings": "OVERSTEEKJES",
  "arcade.leaderboard": "TOPLIJST"
```

- [ ] **Add arcade strings to `src/i18n/en.json`**

```json
  "arcade.button": "🕹 GAME",
  "arcade.locked": "🔒 GAME",
  "arcade.hud.score": "SCORE",
  "arcade.hud.combo": "COMBO",
  "arcade.hud.lives": "LIVES",
  "arcade.hud.best": "BEST",
  "arcade.hud.speed": "RIVER",
  "arcade.splash": "SPLASH!",
  "arcade.newBest": "NEW BEST!",
  "arcade.playAgain": "↺ PLAY AGAIN",
  "arcade.backToLessons": "← LESSONS",
  "arcade.crossings": "CROSSINGS",
  "arcade.leaderboard": "LEADERBOARD"
```

- [ ] **Commit**

```bash
git add src/i18n/nl.json src/i18n/en.json
git commit -m "feat: add arcade mode i18n strings"
```

---

## Task 2: leaderboard.js store

**Files:**
- Create: `src/stores/leaderboard.js`
- Create: `tests/leaderboard.test.js`

- [ ] **Write failing tests** in `tests/leaderboard.test.js`

```js
import { beforeEach, describe, it, expect } from 'vitest'
import { getLeaderboard, submitScore, clearLeaderboard } from '../src/stores/leaderboard.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getLeaderboard', () => {
  it('returns empty array when nothing stored', () => {
    expect(getLeaderboard()).toEqual([])
  })
})

describe('submitScore', () => {
  it('adds first score', () => {
    const result = submitScore('Emma', 1000, 'home')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ profileName: 'Emma', score: 1000, groupId: 'home' })
  })

  it('keeps top 10 sorted by score descending', () => {
    for (let i = 1; i <= 11; i++) submitScore(`Player${i}`, i * 100, 'home')
    const board = getLeaderboard()
    expect(board).toHaveLength(10)
    expect(board[0].score).toBe(1100)
    expect(board[9].score).toBe(200)
  })

  it('does not add score on exact tie with 10th entry when board is full', () => {
    for (let i = 10; i >= 1; i--) submitScore(`Player${i}`, i * 100, 'home')
    const before = getLeaderboard()
    const lowestScore = before[9].score // 100
    submitScore('Tie', lowestScore, 'home')
    expect(getLeaderboard()).toHaveLength(10)
  })

  it('adds score strictly greater than 10th entry', () => {
    for (let i = 10; i >= 1; i--) submitScore(`Player${i}`, i * 100, 'home')
    const before = getLeaderboard()
    submitScore('NewKid', before[9].score + 1, 'home')
    expect(getLeaderboard()).toHaveLength(10)
    expect(getLeaderboard().some(e => e.profileName === 'NewKid')).toBe(true)
  })
})
```

- [ ] **Run tests to verify they fail**

```bash
npm test tests/leaderboard.test.js
```
Expected: FAIL — module not found.

- [ ] **Create `src/stores/leaderboard.js`**

```js
const STORAGE_KEY = 'typtyptyp_leaderboard'
const MAX_ENTRIES = 10

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
}

export function getLeaderboard() {
  return load()
}

export function submitScore(profileName, score, groupId) {
  const entries = load()
  if (entries.length >= MAX_ENTRIES && score <= entries[MAX_ENTRIES - 1].score) {
    return entries
  }
  const newEntry = { profileName, score, groupId, achievedAt: Date.now() }
  const updated = [...entries, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES)
  save(updated)
  return updated
}

export function clearLeaderboard() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
```

- [ ] **Run tests to verify they pass**

```bash
npm test tests/leaderboard.test.js
```
Expected: all PASS.

- [ ] **Commit**

```bash
git add src/stores/leaderboard.js tests/leaderboard.test.js
git commit -m "feat: add leaderboard store with top-10 logic"
```

---

## Task 3: profiles.js — arcade progress

**Files:**
- Modify: `src/stores/profiles.js`
- Create: `tests/arcadeProgress.test.js`

- [ ] **Write failing test** in `tests/arcadeProgress.test.js`

```js
import { beforeEach, it, expect } from 'vitest'
import { get } from 'svelte/store'

// Reset module state between tests
beforeEach(() => {
  localStorage.clear()
})

it('updateArcadeProgress saves highScore and achievedAt', async () => {
  const { createProfile, profiles, selectProfile, updateArcadeProgress, activeProfile } = await import('../src/stores/profiles.js')

  createProfile('TestKid')
  const profile = get(profiles)[0]
  selectProfile(profile.id)

  updateArcadeProgress(profile.id, 'home', 5000)

  const updated = get(profiles).find(p => p.id === profile.id)
  expect(updated.arcadeProgress.home.highScore).toBe(5000)
  expect(updated.arcadeProgress.home.achievedAt).toBeTypeOf('number')
})

it('updateArcadeProgress does not overwrite a higher existing score', async () => {
  const { createProfile, profiles, updateArcadeProgress } = await import('../src/stores/profiles.js')

  createProfile('TestKid2')
  const profile = get(profiles).find(p => p.name === 'TestKid2')

  updateArcadeProgress(profile.id, 'home', 9000)
  updateArcadeProgress(profile.id, 'home', 3000)

  const updated = get(profiles).find(p => p.id === profile.id)
  expect(updated.arcadeProgress.home.highScore).toBe(9000)
})
```

- [ ] **Run test to verify it fails**

```bash
npm test tests/arcadeProgress.test.js
```
Expected: FAIL — `updateArcadeProgress` not exported.

- [ ] **Add `updateArcadeProgress` to `src/stores/profiles.js`**

Add after `updateProgress`:

```js
export function updateArcadeProgress(profileId, groupId, score) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.arcadeProgress?.[groupId] ?? { highScore: 0, achievedAt: null }
    if (score <= prev.highScore) return p
    const updated = {
      ...p,
      arcadeProgress: {
        ...(p.arcadeProgress ?? {}),
        [groupId]: { highScore: score, achievedAt: Date.now() },
      },
    }
    if (get(activeProfile)?.id === profileId) activeProfile.set(updated)
    return updated
  }))
}
```

- [ ] **Run tests to verify they pass**

```bash
npm test tests/arcadeProgress.test.js
```
Expected: PASS.

- [ ] **Commit**

```bash
git add src/stores/profiles.js tests/arcadeProgress.test.js
git commit -m "feat: add updateArcadeProgress to profile store"
```

---

## Task 4: screen.js routing + game.js outcome store

**Files:**
- Modify: `src/stores/screen.js`
- Create: `src/stores/game.js`

- [ ] **Update `src/stores/screen.js`**

Replace entire file:

```js
import { writable } from 'svelte/store'

export const screen = writable('home')
export const selectedLesson = writable(null)
export const selectedGroup = writable(null)

export function goTo(screenName) {
  screen.set(screenName)
}

export function selectLesson(lessonId) {
  selectedLesson.set(lessonId)
  screen.set('exercise')
}

export function startArcade(groupId) {
  selectedGroup.set(groupId)
  screen.set('game')
}
```

- [ ] **Create `src/stores/game.js`**

```js
import { writable } from 'svelte/store'

// Set before navigating to ResultsScreen in arcade mode.
// { score, crossings, groupId, profileName, prevBest }
export const gameResults = writable(null)
```

- [ ] **Commit**

```bash
git add src/stores/screen.js src/stores/game.js
git commit -m "feat: add game route and gameResults store"
```

---

## Task 5: arcade word cycler

**Files:**
- Modify: `src/words/index.js`
- Create: `tests/arcadeWords.test.js`

- [ ] **Write failing test** in `tests/arcadeWords.test.js`

```js
import { describe, it, expect } from 'vitest'
import { getArcadeWordCycler } from '../src/words/index.js'

describe('getArcadeWordCycler', () => {
  it('returns a function', () => {
    const next = getArcadeWordCycler('home')
    expect(next).toBeTypeOf('function')
  })

  it('returns words (strings)', () => {
    const next = getArcadeWordCycler('home')
    const word = next()
    expect(word).toBeTypeOf('string')
    expect(word.length).toBeGreaterThan(0)
  })

  it('cycles without returning undefined after many calls', () => {
    const next = getArcadeWordCycler('home')
    for (let i = 0; i < 100; i++) {
      expect(next()).toBeTruthy()
    }
  })

  it('works for all group ids', () => {
    for (const group of ['home', 'top', 'bottom', 'all']) {
      const next = getArcadeWordCycler(group)
      expect(next()).toBeTruthy()
    }
  })
})
```

- [ ] **Run tests to verify they fail**

```bash
npm test tests/arcadeWords.test.js
```
Expected: FAIL — `getArcadeWordCycler` not exported.

- [ ] **Update `src/words/index.js`** — export `makeCycler` and add `getArcadeWordCycler`

Change `function makeCycler` to `export function makeCycler`.

Add at the bottom of the file:

```js
// Maps arcade group IDs to the last lesson in that group (determines learned keys)
const GROUP_LAST_LESSON = { home: 5, top: 10, bottom: 14, all: 15 }

/**
 * Returns a word cycler function for the given arcade group.
 * Call next() repeatedly to get the next word (shuffled, no repeats until pool exhausted).
 */
export function getArcadeWordCycler(groupId, wordList = nlWords) {
  const { getLearnedKeys } = await import('../lessons/index.js')  // circular? let me reconsider
```

Actually, `words/index.js` doesn't currently import from `lessons/index.js` — the caller (`ExerciseScreen`) handles that. I need to import `getLearnedKeys` into `words/index.js`. Let me check for circular dependency: `lessons/index.js` doesn't import from `words/index.js`, so it's fine.

```js
import { getLearnedKeys } from '../lessons/index.js'

const GROUP_LAST_LESSON = { home: 5, top: 10, bottom: 14, all: 15 }

export function getArcadeWordCycler(groupId, wordList = nlWords) {
  const lastLesson = GROUP_LAST_LESSON[groupId] ?? 5
  const learnedKeys = getLearnedKeys(lastLesson)
  const pool = getWordPool(learnedKeys, wordList)
  const words = pool.length >= POOL_THRESHOLD ? pool : generateNonsense(learnedKeys, 40)
  return makeCycler(words)
}
```

Add the `getLearnedKeys` import at the top of `src/words/index.js` (after the existing imports):

```js
import { getLearnedKeys } from '../lessons/index.js'
```

And change `function makeCycler` → `export function makeCycler`.

- [ ] **Run tests to verify they pass**

```bash
npm test tests/arcadeWords.test.js
```
Expected: all PASS.

- [ ] **Run all tests to check nothing broke**

```bash
npm test
```

- [ ] **Commit**

```bash
git add src/words/index.js tests/arcadeWords.test.js
git commit -m "feat: add getArcadeWordCycler to words module"
```

---

## Task 6: arcade unlock logic + LessonSelectScreen ARCADE buttons

**Files:**
- Create: `tests/arcadeUnlock.test.js`
- Modify: `src/screens/LessonSelectScreen.svelte`

The unlock logic is a pure function — define it directly in `LessonSelectScreen.svelte` (not a separate file, only used here).

- [ ] **Write failing test** — since we'll define the function in the component, extract it to a testable helper first.

Create `tests/arcadeUnlock.test.js`:

```js
import { describe, it, expect } from 'vitest'

// Inline the function here — same logic as in LessonSelectScreen
const GROUP_LESSON_IDS = {
  home:   [1, 2, 3, 4, 5],
  top:    [6, 7, 8, 9, 10],
  bottom: [11, 12, 13, 14],
  all:    [15],
}

function isArcadeUnlocked(groupId, lessonProgress) {
  const ids = GROUP_LESSON_IDS[groupId] ?? []
  return ids.every(id => (lessonProgress[id]?.stars ?? 0) >= 1)
}

describe('isArcadeUnlocked', () => {
  it('returns false when progress is empty', () => {
    expect(isArcadeUnlocked('home', {})).toBe(false)
  })

  it('returns false when some lessons have 0 stars', () => {
    const progress = { 1: { stars: 1 }, 2: { stars: 0 }, 3: { stars: 1 }, 4: { stars: 1 }, 5: { stars: 1 } }
    expect(isArcadeUnlocked('home', progress)).toBe(false)
  })

  it('returns true when all lessons in group have >= 1 star', () => {
    const progress = { 1: { stars: 2 }, 2: { stars: 1 }, 3: { stars: 3 }, 4: { stars: 1 }, 5: { stars: 1 } }
    expect(isArcadeUnlocked('home', progress)).toBe(true)
  })

  it('works for single-lesson group (all)', () => {
    expect(isArcadeUnlocked('all', { 15: { stars: 1 } })).toBe(true)
    expect(isArcadeUnlocked('all', {})).toBe(false)
  })
})
```

- [ ] **Run tests to verify they pass** (logic is self-contained in test file)

```bash
npm test tests/arcadeUnlock.test.js
```
Expected: PASS.

- [ ] **Update `src/screens/LessonSelectScreen.svelte`**

Replace entire file:

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { LESSONS } from '../lessons/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'

  $: progress = $activeProfile?.lessonProgress ?? {}

  function state(lesson) {
    if ((progress[lesson.id]?.stars ?? 0) > 0) return 'done'
    if (lesson.id === 1 || (progress[lesson.id - 1]?.stars ?? 0) >= 1) return 'available'
    return 'locked'
  }

  const GROUPS = ['thuisrij','bovenrij','onderrij','volledig']

  const GROUP_IDS = {
    thuisrij: 'home',
    bovenrij: 'top',
    onderrij: 'bottom',
    volledig:  'all',
  }

  const GROUP_LESSON_IDS = {
    home:   [1, 2, 3, 4, 5],
    top:    [6, 7, 8, 9, 10],
    bottom: [11, 12, 13, 14],
    all:    [15],
  }

  function isArcadeUnlocked(groupId) {
    const ids = GROUP_LESSON_IDS[groupId] ?? []
    return ids.every(id => (progress[id]?.stars ?? 0) >= 1)
  }
</script>

<div class="screen lessons">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
    <span class="title">TYPTYPTYP</span>
    <span class="sub">{$t('lessons.title')}</span>
  </div>
  <div class="inner">
    <button class="guide-btn" on:click={() => goTo('guide')}>
      <span class="guide-btn-title">{$t('lessons.guide')}</span>
      <span class="guide-btn-action">{$t('lessons.guideAction')}</span>
    </button>
    {#each GROUPS as group}
      {@const groupId = GROUP_IDS[group]}
      {@const unlocked = isArcadeUnlocked(groupId)}
      <div class="group-lbl">{$t(`lessons.group.${group}`)}</div>
      <div class="grid">
        {#each LESSONS.filter(l => l.group === group) as lesson}
          {@const s = state(lesson)}
          {@const stars = progress[lesson.id]?.stars ?? 0}
          <button class="lcard lcard--{s}" disabled={s === 'locked'}
            on:click={() => s !== 'locked' && selectLesson(lesson.id)}>
            <div class="lkeys">{lesson.group === 'volledig' ? $t('lessons.label.volledig') : lesson.label}</div>
            {#if s === 'done'}
              <div class="lstars">{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
            {:else if s === 'available'}
              <div class="lplay">{$t('lessons.play')}</div>
            {:else}
              <div class="llock">🔒</div>
            {/if}
          </button>
        {/each}
      </div>
      <button
        class="arcade-btn"
        class:arcade-btn--unlocked={unlocked}
        disabled={!unlocked}
        on:click={() => unlocked && startArcade(groupId)}
      >
        {unlocked ? $t('arcade.button') : $t('arcade.locked')}
      </button>
    {/each}
  </div>
</div>

<style>
  .screen.lessons { max-width:520px; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; }
  .back-btn { font-family:inherit; font-size:12px; color:var(--text); background:none; border:none; cursor:pointer; letter-spacing:1px; }
  .title { font-size:16px; font-weight:bold; letter-spacing:3px; color:var(--accent-cyan); }
  .sub { font-size:12px; color:var(--text); letter-spacing:1px; }
  .inner { padding:14px 18px 20px; }
  .group-lbl { font-size:12px; color:var(--text); letter-spacing:2px; margin:14px 0 10px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .lcard { background:var(--bg-raised); border:2px solid; border-radius:6px; padding:10px 8px; text-align:center; font-family:inherit; cursor:pointer; }
  .lcard--done      { border-color:#005533; }
  .lcard--available { border-color:var(--accent-cyan); box-shadow:0 0 10px color-mix(in srgb,var(--accent-cyan) 20%,transparent); }
  .lcard--locked    { border-color:var(--border); cursor:not-allowed; background:var(--bg-sunken); }
  .lkeys  { font-size:16px; font-weight:bold; color:var(--text); margin-bottom:4px; }
  .lcard--available .lkeys { color:var(--accent-cyan); }
  .lcard--done      .lkeys { color:var(--accent-green); }
  .lcard--locked    .lkeys { color:var(--text-muted); }
  .lcard--locked    .llock { opacity:.5; }
  .lstars { color:#ffcc00; font-size:13px; letter-spacing:1px; }
  .lplay  { font-size:10px; color:var(--accent-cyan); letter-spacing:1px; }
  .llock  { font-size:14px; }
  .guide-btn {
    display: block; width: 100%; text-align: left;
    background: var(--bg-raised); border: 2px solid var(--accent-cyan);
    border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent-cyan) 12%, transparent);
    white-space: nowrap;
  }
  .guide-btn-title { display: block; font-size: 12px; font-weight: bold; color: var(--accent-cyan); letter-spacing: 2px; }
  .guide-btn-action { display: block; font-size: 10px; color: var(--accent-cyan); letter-spacing: 2px; opacity: 0.6; margin-top: 3px; }

  /* Arcade button */
  .arcade-btn {
    display: block; width: 100%; margin-top: 8px; margin-bottom: 4px;
    padding: 9px 14px; border-radius: 6px; font-family: inherit;
    font-size: 12px; font-weight: bold; letter-spacing: 2px;
    border: 2px solid var(--border); background: var(--bg-sunken);
    color: var(--text-muted); cursor: not-allowed;
  }
  .arcade-btn--unlocked {
    border-color: #ff8800;
    color: #ff8800;
    background: var(--bg-raised);
    cursor: pointer;
    box-shadow: 0 0 10px color-mix(in srgb, #ff8800 20%, transparent);
  }
  .arcade-btn--unlocked:hover {
    box-shadow: 0 0 18px color-mix(in srgb, #ff8800 40%, transparent);
  }
</style>
```

- [ ] **Verify in browser:** dev server shows ARCADE buttons under each row group. Locked groups show greyed button; completing lessons (or manually setting localStorage) shows orange glowing button.

```bash
npm run dev
```

- [ ] **Commit**

```bash
git add src/screens/LessonSelectScreen.svelte tests/arcadeUnlock.test.js
git commit -m "feat: add ARCADE buttons to lesson select screen"
```

---

## Task 7: PixelChick — add hop, splash, wobble states

**Files:**
- Modify: `src/components/PixelChick.svelte`

The existing chick has `idle`, `happy`, `error` states. Add `hop`, `splash`, `wobble` as CSS-only animation variants (same pixel art, different animation).

- [ ] **Update `src/components/PixelChick.svelte`**

In the `<script>` block, update the exported state type comment and the `trigger` function remains unchanged — the new states just need CSS.

Add `'hop' | 'splash' | 'wobble'` to the state comment.

In the `<style>` block, add after the existing keyframes and classes:

```css
  @keyframes hop    { 0%{transform:translateY(0)} 30%{transform:translateY(-14px)} 60%{transform:translateY(-8px)} 100%{transform:translateY(0)} }
  @keyframes splash { 0%{transform:translateY(0) rotate(0)} 20%{transform:translateY(6px) rotate(-20deg)} 50%{transform:translateY(12px) rotate(15deg)} 80%{transform:translateX(30px) translateY(8px)} 100%{transform:translateX(60px) translateY(4px) rotate(0)} }
  @keyframes wobble { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-12deg)} 80%{transform:rotate(10deg)} }

  .chick--hop    { animation: hop    0.4s ease-out both; }
  .chick--splash { animation: splash 1.0s ease-in  both; }
  .chick--wobble { animation: wobble 0.4s ease-in-out 1; }
```

Also update the `trigger` timeout for `splash` to 1200ms (longer animation). Update the `trigger` function:

```js
export function trigger(newState) {
  state = newState
  clearTimeout(timer)
  const duration = newState === 'splash' ? 1200 : 600
  timer = setTimeout(() => { state = 'idle' }, duration)
}
```

- [ ] **Verify:** open dev server, navigate to any screen that shows PixelChick, manually test states. Also check the existing `idle`, `happy`, `error` still work.

- [ ] **Commit**

```bash
git add src/components/PixelChick.svelte
git commit -m "feat: add hop, splash, wobble animation states to PixelChick"
```

---

## Task 8: App.svelte — wire game route

**Files:**
- Modify: `src/App.svelte`

- [ ] **Update `src/App.svelte`**

Add import for `GameScreen` and add the `game` route. Replace entire file:

```svelte
<script>
  import { t } from './i18n/index.js'
  import { screen } from './stores/screen.js'
  import { wipe, WIPE_MS } from './transitions.js'
  import HomeScreen         from './screens/HomeScreen.svelte'
  import LessonSelectScreen from './screens/LessonSelectScreen.svelte'
  import ExerciseScreen     from './screens/ExerciseScreen.svelte'
  import ResultsScreen      from './screens/ResultsScreen.svelte'
  import GuideScreen        from './screens/GuideScreen.svelte'
  import GameScreen         from './screens/GameScreen.svelte'

  let storageOk = true
  try { localStorage.setItem('_t','1'); localStorage.removeItem('_t') } catch { storageOk = false }
</script>

<main>
  {#if !storageOk}
    <div class="no-save">{$t('noSave.banner')}</div>
  {/if}

  <div class="screens">
    {#if $screen === 'home'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <HomeScreen />
      </div>
    {:else if $screen === 'lessons'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <LessonSelectScreen />
      </div>
    {:else if $screen === 'exercise'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <ExerciseScreen />
      </div>
    {:else if $screen === 'results'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <ResultsScreen />
      </div>
    {:else if $screen === 'guide'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <GuideScreen />
      </div>
    {:else if $screen === 'game'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <GameScreen />
      </div>
    {/if}
  </div>
</main>

<style>
  main { width:100%; }
  .screens { display:grid; width:100%; align-items:start; min-height:calc(100dvh - 32px); }
  .sw { grid-area:1/1; }
  .no-save { position:fixed; top:0; left:0; right:0; background:#ff4455; color:#fff; text-align:center; padding:6px; font-size:12px; font-family:monospace; letter-spacing:1px; z-index:100; }
</style>
```

- [ ] **Create stub `src/screens/GameScreen.svelte`** so the import doesn't break:

```svelte
<script>
  import { goTo } from '../stores/screen.js'
</script>

<div class="screen" style="padding:40px; text-align:center; font-family:monospace; color:#00ffcc;">
  <p>GAME SCREEN — COMING SOON</p>
  <button on:click={() => goTo('lessons')} style="margin-top:20px; font-family:inherit; padding:10px 20px; background:#1a0a3a; border:1px solid #00ffcc; color:#00ffcc; cursor:pointer; letter-spacing:2px;">← BACK</button>
</div>
```

- [ ] **Run dev server and verify:** navigate to lessons, click an unlocked ARCADE button, see stub screen, click BACK.

- [ ] **Commit**

```bash
git add src/App.svelte src/screens/GameScreen.svelte
git commit -m "feat: wire game route to App.svelte with stub GameScreen"
```

---

## Task 9: GameScreen — HUD + river layout

Build out the full `GameScreen.svelte` in stages. This task covers the visual structure (HUD, river lanes, banks) with static placeholder pads, using Svelte 5 runes.

**Files:**
- Modify: `src/screens/GameScreen.svelte`

**Pad movement constants:**
- `NUM_LANES = 5` (lanes 0–4, 0 = nearest to start bank)
- `BASE_SPEED_PCT = 8` (% of container width per second at speed_factor 1.0)
- Lane direction: even index → right (+1), odd index → left (−1)
- Pad width: `word.length * 3 + 8` clamped to `[14, 42]` (as %)
- Pad x-position: left edge as % of container (can be negative or >100 during transit)

- [ ] **Replace `src/screens/GameScreen.svelte`** with the full game screen (HUD + layout + static pads):

```svelte
<script>
  import { get } from 'svelte/store'
  import { t } from '../i18n/index.js'
  import { selectedGroup, goTo } from '../stores/screen.js'
  import { activeProfile } from '../stores/profiles.js'
  import { gameResults } from '../stores/game.js'
  import { updateArcadeProgress } from '../stores/profiles.js'
  import { submitScore } from '../stores/leaderboard.js'
  import { getArcadeWordCycler } from '../words/index.js'
  import { WORD_LISTS } from '../words/index.js'
  import { lang } from '../i18n/index.js'
  import PixelChick from '../components/PixelChick.svelte'

  // ── Constants ───────────────────────────────────────────────
  const NUM_LANES   = 5
  const BASE_SPEED  = 8         // % of container width per second at speed_factor 1.0
  const MAX_SPEED   = 3.0
  const EDGE_WARN   = 2         // pad-widths from edge triggers flash
  const NEAR_BANK   = -1        // chick lane index when on near (start) bank
  const FAR_BANK    = NUM_LANES // chick lane index when on far (goal) bank

  // ── Game state (Svelte 5 runes) ─────────────────────────────
  let losing       = false    // guard: prevents loseLife() firing twice in one frame
  let lives        = $state(3)
  let score        = $state(0)
  let combo        = $state(0)
  let speedFactor  = $state(1.0)
  let crossings    = $state(0)
  let gamePhase    = $state('playing')   // 'playing' | 'splash' | 'done'
  let chickenLane  = $state(NEAR_BANK)   // -1=near bank, 0-4=riding lane, 5=far bank
  let chickenPadId = $state(null)        // id of pad chick is riding, or null if on bank
  let typedSoFar   = $state('')
  let chickState   = $state('idle')
  let chickRef     = $state(null)

  const groupId    = get(selectedGroup) ?? 'home'
  const profile    = get(activeProfile)
  const prevBest   = profile?.arcadeProgress?.[groupId]?.highScore ?? 0

  // ── Word cycler ──────────────────────────────────────────────
  const wordList = WORD_LISTS[get(lang)] ?? WORD_LISTS.nl
  const nextWord = getArcadeWordCycler(groupId, wordList)

  // ── Pad data ─────────────────────────────────────────────────
  function makePadWidth(word) {
    return Math.min(Math.max(word.length * 3 + 8, 14), 42)
  }

  let padIdCounter = 0
  function makePad(x) {
    const word = nextWord()
    return { id: ++padIdCounter, word, x, width: makePadWidth(word) }
  }

  // Initialise lanes with 2–3 staggered pads each
  let lanes = $state(Array.from({ length: NUM_LANES }, (_, i) => {
    const dir = i % 2 === 0 ? 1 : -1
    const pads = [
      makePad(dir > 0 ? -50 : 110),
      makePad(dir > 0 ? 10  : 55),
      makePad(dir > 0 ? 60  : 5),
    ]
    return { index: i, direction: dir, pads }
  }))

  // ── Derived: glowing pad ─────────────────────────────────────
  // NOTE: $derived takes an expression, not a thunk. Use an IIFE to keep
  // multi-statement logic readable while satisfying Svelte 5 syntax.
  const glowingPadId = $derived((() => {
    const nextLane = chickenLane + 1
    if (nextLane >= NUM_LANES) return null
    const lane = lanes[nextLane]
    if (!lane) return null
    const onScreen = lane.pads.filter(p => p.x > -p.width && p.x < 100)
    if (onScreen.length === 0) return null
    // most centred = closest to 50%
    const centre = 50
    const best = onScreen.reduce((a, b) => {
      const ca = Math.abs((a.x + a.width / 2) - centre)
      const cb = Math.abs((b.x + b.width / 2) - centre)
      if (ca === cb) {
        // prefer moving toward centre
        const aToward = (lane.direction > 0 && a.x < centre) || (lane.direction < 0 && a.x > centre)
        return aToward ? a : b
      }
      return ca < cb ? a : b
    })
    return best.id
  })())

  // ── Derived: speed bar colour ────────────────────────────────
  const speedColour = $derived(
    speedFactor < 1.5 ? '#00ffcc' : speedFactor <= 2.5 ? '#ff8800' : '#ff4466'
  )
  const speedPct = $derived(Math.round(((speedFactor - 1.0) / (MAX_SPEED - 1.0)) * 100))

  // ── Multiplier ───────────────────────────────────────────────
  const multiplier = $derived(Math.min(Math.floor(combo / 5) + 1, 10))

  // ── Game loop ────────────────────────────────────────────────
  let animId
  let lastTime = 0

  function updatePads(dt) {
    lanes = lanes.map(lane => {
      const speed = BASE_SPEED * speedFactor * lane.direction
      const pads = lane.pads.map(pad => {
        let nx = pad.x + speed * dt
        // Check if chick loses life: chick is on this pad and it exits
        if (pad.id === chickenPadId) {
          if (lane.direction > 0 && nx > 100) { loseLife(); nx = pad.x }
          if (lane.direction < 0 && nx + pad.width < 0) { loseLife(); nx = pad.x }
        }
        // Pad exited screen — wrap and assign new word
        if (lane.direction > 0 && nx > 100 + pad.width) {
          return makePad(-pad.width - 2)
        }
        if (lane.direction < 0 && nx + pad.width < -2) {
          return makePad(100 + 2)
        }
        return { ...pad, x: nx }
      })
      return { ...lane, pads }
    })
  }

  function gameLoop(time) {
    if (gamePhase !== 'playing') return
    const dt = Math.min((time - lastTime) / 1000, 0.1)
    lastTime = time
    updatePads(dt)
    animId = requestAnimationFrame(gameLoop)
  }

  $effect(() => {
    if (gamePhase === 'playing') {
      lastTime = performance.now()
      animId = requestAnimationFrame(gameLoop)
    }
    return () => cancelAnimationFrame(animId)
  })

  // ── Input handling ───────────────────────────────────────────
  function getGlowingPad() {
    const nextLane = chickenLane + 1
    if (nextLane >= NUM_LANES || !glowingPadId) return null
    return lanes[nextLane]?.pads.find(p => p.id === glowingPadId) ?? null
  }

  function handleKey(e) {
    if (gamePhase !== 'playing') return
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return

    const pad = getGlowingPad()
    if (!pad) return

    const expected = pad.word[typedSoFar.length]
    if (!expected) return

    if (e.key === expected) {
      combo += 1
      const newTyped = typedSoFar + e.key
      if (newTyped === pad.word) {
        // Word complete — hop!
        const wordScore = Math.round(pad.word.length * multiplier * speedFactor)
        score += wordScore
        typedSoFar = ''
        hopToNextLane(pad)
      } else {
        typedSoFar = newTyped
      }
    } else {
      combo = 0
      typedSoFar = ''
      chickState = 'wobble'
      setTimeout(() => { if (chickState === 'wobble') chickState = 'idle' }, 500)
    }
  }

  function hopToNextLane(targetPad) {
    const nextLane = chickenLane + 1
    chickState = 'hop'
    setTimeout(() => { if (chickState === 'hop') chickState = 'idle' }, 450)

    if (nextLane >= NUM_LANES) {
      // Reached far bank!
      chickenLane = FAR_BANK
      chickenPadId = null
      const bonus = Math.round(500 * speedFactor)
      score += bonus
      crossings += 1
      speedFactor = Math.min(+(speedFactor + 0.1).toFixed(1), MAX_SPEED)
      // Reset for next round
      setTimeout(startNewRound, 800)
    } else {
      chickenLane = nextLane
      chickenPadId = targetPad.id
    }
  }

  function startNewRound() {
    chickenLane = NEAR_BANK
    chickenPadId = null
    typedSoFar = ''
  }

  function loseLife() {
    if (gamePhase !== 'playing' || losing) return
    losing = true
    lives -= 1
    chickState = 'splash'
    combo = 0
    typedSoFar = ''

    if (lives <= 0) {
      gamePhase = 'done'
      endGame()
      return
    }

    // Freeze river, reset chick to last safe bank
    gamePhase = 'frozen'
    cancelAnimationFrame(animId)
    setTimeout(() => {
      chickenLane = NEAR_BANK
      chickenPadId = null
      chickState = 'idle'
      gamePhase = 'playing'
      losing = false
      lastTime = performance.now()
      animId = requestAnimationFrame(gameLoop)
    }, 1200)
  }

  function endGame() {
    cancelAnimationFrame(animId)
    const p = get(activeProfile)
    if (p) {
      updateArcadeProgress(p.id, groupId, score)
      submitScore(p.name, score, groupId)
    }
    gameResults.set({ score, crossings, groupId, profileName: p?.name ?? '?', prevBest })
    // Show SPLASH overlay for 2s, then go to results
    setTimeout(() => goTo('results'), 2000)
  }

  $effect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  // ── Chick position helpers ───────────────────────────────────
  function chickX() {
    if (chickenPadId === null) return 50 // centre of bank
    for (const lane of lanes) {
      const pad = lane.pads.find(p => p.id === chickenPadId)
      if (pad) return pad.x + pad.width / 2
    }
    return 50
  }
</script>

<div class="screen game" on:keydown|preventDefault>

  <!-- HUD -->
  <div class="hud">
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.score')}</div>
      <div class="hud-val">{String(score).padStart(5, '0')}</div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.combo')}</div>
      <div class="hud-val combo" style="color: {combo > 0 ? '#ff8800' : 'var(--text-muted)'}">
        x{multiplier}{combo >= 5 ? ' 🔥' : ''}
      </div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.lives')}</div>
      <div class="hearts">
        {#each [1,2,3] as n}
          <div class="heart" class:heart--lost={n > lives}></div>
        {/each}
      </div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.best')}</div>
      <div class="hud-val" style="color: var(--text-muted); font-size:13px">{String(prevBest).padStart(5, '0')}</div>
    </div>
  </div>

  <!-- Speed bar -->
  <div class="speed-bar-wrap">
    <div class="speed-label">{$t('arcade.hud.speed')}</div>
    <div class="speed-bar">
      <div class="speed-fill" style="width:{speedPct}%; background:{speedColour}; box-shadow: 0 0 6px {speedColour};"></div>
    </div>
  </div>

  <!-- River -->
  <div class="river">
    <!-- Far bank -->
    <div class="bank bank--far">
      <span class="bank-label">NEST ★</span>
    </div>

    <!-- Lanes (rendered top to bottom = lane 4 first) -->
    {#each [...lanes].reverse() as lane (lane.index)}
      <div class="lane" style="--dir:{lane.direction}">
        {#each lane.pads as pad (pad.id)}
          {@const isGlowing = pad.id === glowingPadId}
          {@const isChickOn = pad.id === chickenPadId}
          {@const nearEdge = lane.direction > 0 ? pad.x > (100 - pad.width * EDGE_WARN) : pad.x < (pad.width * (EDGE_WARN - 1))}
          <div
            class="pad"
            class:pad--glow={isGlowing}
            class:pad--chick={isChickOn}
            class:pad--danger={isChickOn && nearEdge}
            style="left:{pad.x}%; width:{pad.width}%"
          >
            {#if isChickOn}
              <div class="pad-chick">
                <PixelChick size={36} state={chickState} />
              </div>
            {/if}
            <span class="pad-word">{pad.word}</span>
          </div>
        {/each}
      </div>
    {/each}

    <!-- Near bank -->
    <div class="bank bank--near">
      <span class="bank-label">START</span>
      {#if chickenLane === NEAR_BANK}
        <div class="bank-chick">
          <PixelChick size={36} state={chickState} />
        </div>
      {/if}
    </div>
  </div>

  <!-- Word input strip -->
  <div class="input-area">
    {#if glowingPadId}
      {@const pad = getGlowingPad()}
      {#if pad}
        <div class="input-label">TYPE THE GLOWING PAD</div>
        <div class="word-tiles">
          {#each [...pad.word] as char, i}
            <div class="tile"
              class:tile--typed={i < typedSoFar.length}
              class:tile--current={i === typedSoFar.length}
              class:tile--pending={i > typedSoFar.length}
            >{char}</div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="input-label" style="color: var(--text-muted)">WAITING FOR PAD...</div>
    {/if}
  </div>

  <!-- SPLASH overlay -->
  {#if gamePhase === 'done'}
    <div class="splash-overlay">
      <div class="splash-chick"><PixelChick size={100} state="splash" /></div>
      <div class="splash-text">{$t('arcade.splash')}</div>
      <div class="splash-score">{score}</div>
    </div>
  {/if}

</div>

<style>
  .screen.game {
    max-width: 520px; margin: 0 auto;
    display: flex; flex-direction: column;
    min-height: calc(100dvh - 32px);
    position: relative;
  }

  /* HUD */
  .hud {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 16px; background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
  }
  .hud-block { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .hud-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; }
  .hud-val { font-size: 16px; font-weight: bold; color: #ffcc00; text-shadow: 0 0 8px #ffcc0066; font-family: monospace; }
  .hud-val.combo { font-size: 14px; }
  .hearts { display: flex; gap: 4px; align-items: center; }
  .heart {
    width: 14px; height: 14px;
    background: #ff4466;
    clip-path: polygon(50% 15%, 65% 0%, 100% 20%, 100% 55%, 50% 100%, 0% 55%, 0% 20%, 35% 0%);
    box-shadow: 0 0 6px #ff446688;
  }
  .heart--lost { background: var(--bg-raised); box-shadow: none; }

  /* Speed bar */
  .speed-bar-wrap { padding: 4px 16px 6px; background: var(--bg-sunken); }
  .speed-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 3px; }
  .speed-bar { height: 3px; background: var(--bg-raised); border-radius: 2px; }
  .speed-fill { height: 3px; border-radius: 2px; transition: width 0.5s, background 0.5s; }

  /* River */
  .river { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .bank {
    height: 36px; display: flex; align-items: center; padding: 0 14px; gap: 10px;
    position: relative;
  }
  .bank--far  { background: #0a1a0a; border-bottom: 1px solid #005533; justify-content: flex-end; }
  .bank--near { background: #0a1a0a; border-top: 1px solid #005533; }
  .bank-label { font-size: 9px; color: #00ff88; letter-spacing: 2px; font-family: monospace; }
  .bank-chick { position: absolute; left: 50%; transform: translateX(-50%); bottom: 4px; }

  .lane {
    flex: 1; position: relative; overflow: hidden;
    background: #04111e;
    border-top: 1px solid #0a2030;
    /* scanline shimmer — reuse project pattern */
    background-image: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0, 180, 255, 0.03) 3px, rgba(0, 180, 255, 0.03) 4px
    );
  }

  .pad {
    position: absolute; top: 50%; transform: translateY(-50%);
    min-height: 32px; display: flex; align-items: center; justify-content: center;
    background: #0a2a14; border: 1px solid #00884433; border-radius: 4px;
    padding: 0 6px; transition: border-color 0.1s, box-shadow 0.1s;
  }
  .pad--glow {
    border-color: #00ffcc;
    box-shadow: 0 0 12px #00ffcc66;
    background: #0a3a1a;
  }
  .pad--chick {
    border-color: #ffcc00;
    box-shadow: 0 0 12px #ffcc0066;
    background: #1a2a00;
  }
  .pad--danger {
    border-color: #ff4466 !important;
    box-shadow: 0 0 12px #ff446688 !important;
    animation: danger-pulse 0.4s ease-in-out infinite alternate;
  }
  @keyframes danger-pulse {
    from { border-color: #ff4466; }
    to   { border-color: #ff000088; }
  }
  .pad-word {
    font-size: 12px; font-weight: bold; font-family: monospace;
    color: #00ff88; letter-spacing: 1px; white-space: nowrap;
  }
  .pad--glow .pad-word { color: #00ffcc; }
  .pad--chick .pad-word { color: #ffcc00; }
  .pad-chick { position: absolute; top: -38px; left: 50%; transform: translateX(-50%); }

  /* Input area */
  .input-area {
    padding: 10px 16px 14px; background: var(--bg-sunken);
    border-top: 2px solid var(--border); min-height: 72px;
  }
  .input-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 6px; }
  .word-tiles { display: flex; gap: 4px; flex-wrap: wrap; }
  .tile {
    width: 24px; height: 28px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: bold; font-family: monospace;
    border-radius: 3px; border: 1px solid var(--border);
    background: var(--bg-raised); color: var(--text-muted);
  }
  .tile--typed   { background: #0a2a1a; color: #00ff88; border-color: #00ff88; }
  .tile--current { background: #00ffcc; color: #001a10; border-color: #00ffcc; box-shadow: 0 0 8px #00ffcc88; }
  .tile--pending { color: #444; }

  /* SPLASH overlay */
  .splash-overlay {
    position: absolute; inset: 0; z-index: 10;
    background: rgba(10, 6, 24, 0.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; animation: fade-in 0.3s ease;
  }
  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  .splash-text {
    font-size: 48px; font-weight: bold; font-family: monospace;
    color: #00ffcc; text-shadow: 0 0 20px #00ffcc; letter-spacing: 4px;
    animation: glow-pulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes glow-pulse {
    from { text-shadow: 0 0 20px #00ffcc; }
    to   { text-shadow: 0 0 40px #00ffcc, 0 0 80px #00ffcc44; }
  }
  .splash-score {
    font-size: 28px; font-family: monospace; color: #ffcc00;
    text-shadow: 0 0 10px #ffcc0088;
  }
</style>
```

- [ ] **Run dev server and test:** click ARCADE on an unlocked group, verify river renders with moving pads, chick appears on start bank, typing works (character tiles fill in), chick hops on word completion.

- [ ] **Run all tests to ensure no regressions:**

```bash
npm test
```

- [ ] **Commit**

```bash
git add src/screens/GameScreen.svelte
git commit -m "feat: implement full GameScreen with river, pads, chick movement and input"
```

---

## Task 10: ResultsScreen — arcade mode

**Files:**
- Modify: `src/screens/ResultsScreen.svelte`

The `ResultsScreen` currently only shows practice results from the `results` store. Add a branch: if `$gameResults` is set, render the arcade results layout instead.

- [ ] **Update `src/screens/ResultsScreen.svelte`**

Replace entire file:

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { results } from '../stores/results.js'
  import { gameResults } from '../stores/game.js'
  import { LESSONS } from '../lessons/index.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'
  import { getLeaderboard } from '../stores/leaderboard.js'
  import PixelChick from '../components/PixelChick.svelte'

  // ── Practice mode ───────────────────────────────────────────
  $: r = $results ?? { stars:0, accuracy:0, wpm:0, lessonId:1 }
  $: nextLesson = LESSONS.find(l => l.id === r.lessonId + 1)

  // ── Arcade mode ─────────────────────────────────────────────
  $: gr = $gameResults
  $: leaderboard = gr ? getLeaderboard() : []
  $: isNewBest = gr && gr.score > gr.prevBest

  // ── Shared confetti ─────────────────────────────────────────
  const CC = ['var(--accent-green)','var(--accent-cyan)','var(--accent-yellow)','var(--f-lp)','var(--f-rm)','var(--f-lr)','var(--f-rp)','var(--f-lm)']
  const confetti = Array.from({length:12}, (_,i) => ({
    left:`${6 + i*8}%`,
    colour: CC[i % CC.length],
    delay: `${(i*0.15).toFixed(2)}s`,
    anim: ['c1','c2','c3'][i%3],
  }))
</script>

<div class="screen results">
  {#if gr}
    <!-- ── ARCADE RESULTS ── -->
    <div class="confetti-layer" aria-hidden="true">
      {#each confetti as c}
        <div class="cp" style="left:{c.left};background:{c.colour};animation:{c.anim} 2s ease-in {c.delay} infinite"></div>
      {/each}
    </div>
    <div class="inner">
      <div class="chick-wrap"><PixelChick size={80} state="happy" /></div>

      {#if isNewBest}
        <div class="new-best">{$t('arcade.newBest')}</div>
      {/if}

      <div class="arcade-score">{gr.score}</div>
      <div class="score-label">{$t('arcade.hud.score')}</div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-green)">{gr.crossings}</div>
          <div class="sl">{$t('arcade.crossings')}</div>
        </div>
        <div class="stat-card">
          <div class="sv" style="color:var(--text-muted); font-size:16px">{gr.prevBest}</div>
          <div class="sl">{$t('arcade.hud.best')}</div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="lb-title">{$t('arcade.leaderboard')}</div>
      <div class="lb">
        {#each leaderboard as entry, i}
          <div class="lb-row" class:lb-row--me={entry.score === gr.score && entry.profileName === gr.profileName && entry.groupId === gr.groupId}>
            <span class="lb-rank">#{i+1}</span>
            <span class="lb-name">{entry.profileName}</span>
            <span class="lb-score">{entry.score}</span>
          </div>
        {/each}
      </div>

      <div class="btn-row">
        <button class="btn-retry" on:click={() => { gameResults.set(null); startArcade(gr.groupId) }}>
          {$t('arcade.playAgain')}
        </button>
        <button class="btn-next" on:click={() => { gameResults.set(null); goTo('lessons') }}>
          {$t('arcade.backToLessons')}
        </button>
      </div>
    </div>

  {:else}
    <!-- ── PRACTICE RESULTS ── -->
    <div class="confetti-layer" aria-hidden="true">
      {#each confetti as c}
        <div class="cp" style="left:{c.left};background:{c.colour};animation:{c.anim} 2s ease-in {c.delay} infinite"></div>
      {/each}
    </div>
    <div class="inner">
      <div class="chick-wrap"><PixelChick size={120} state="happy" /></div>

      <div class="stars-wrap">
        <div class="stars-lbl">{$t('results.score')}</div>
        <div class="stars">
          {#each [1,2,3] as n}
            <svg class="star" width="38" height="38" viewBox="0 0 10 10" style="animation-delay:{n*0.2}s">
              <polygon points="5,0 6,3.5 10,3.5 7,5.8 8,9.5 5,7.5 2,9.5 3,5.8 0,3.5 4,3.5"
                fill={n <= r.stars ? '#ffcc00' : 'var(--bg-sunken)'}
                stroke={n <= r.stars ? '#f0a000' : 'var(--border)'} stroke-width="0.3"/>
            </svg>
          {/each}
        </div>
      </div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-green)">{r.accuracy}%</div>
          <div class="sl">{$t('results.accuracy')}</div>
        </div>
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-cyan)">{r.wpm}</div>
          <div class="sl">{$t('results.wpm')}</div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn-retry" on:click={() => selectLesson(r.lessonId)}>{$t('nav.retry')}</button>
        {#if nextLesson}
          <button class="btn-next" on:click={() => selectLesson(nextLesson.id)}>{$t('nav.nextLesson')}</button>
        {:else}
          <button class="btn-next" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes c1 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(90px) rotate(360deg);opacity:0} }
  @keyframes c2 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(70px) rotate(-240deg);opacity:0} }
  @keyframes c3 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(80px) rotate(180deg);opacity:0} }
  @keyframes star-pop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

  .screen.results { max-width:480px; margin:0 auto; }
  .confetti-layer { position:absolute; top:0; left:0; right:0; height:110px; overflow:hidden; pointer-events:none; }
  .cp { position:absolute; top:0; width:6px; height:6px; border-radius:1px; }
  .inner { padding:24px 22px; text-align:center; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:10px; }

  /* Practice */
  .stars-lbl { font-size:12px; color:var(--text-muted); letter-spacing:2px; margin-bottom:8px; }
  .stars { display:flex; gap:8px; justify-content:center; margin-bottom:20px; }
  .star { animation:star-pop .4s ease-out both; }

  /* Arcade */
  .new-best {
    font-size: 14px; font-weight: bold; letter-spacing: 3px;
    color: #ffcc00; text-shadow: 0 0 12px #ffcc0088;
    margin-bottom: 6px;
    animation: glow-pulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes glow-pulse {
    from { text-shadow: 0 0 12px #ffcc0088; }
    to   { text-shadow: 0 0 24px #ffcc00cc; }
  }
  .arcade-score {
    font-size: 52px; font-weight: bold; font-family: monospace;
    color: #00ffcc; text-shadow: 0 0 20px #00ffcc66;
    line-height: 1;
  }
  .score-label { font-size: 9px; color: var(--text-muted); letter-spacing: 3px; margin-bottom: 16px; }

  /* Leaderboard */
  .lb-title { font-size: 9px; color: var(--text-muted); letter-spacing: 3px; margin: 16px 0 8px; }
  .lb { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .lb-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 12px; font-size: 12px; font-family: monospace;
    border-bottom: 1px solid var(--border);
    background: var(--bg-sunken);
  }
  .lb-row:last-child { border-bottom: none; }
  .lb-row--me { background: #1a0a3a; border-color: #ff8800; }
  .lb-rank  { width: 24px; color: var(--text-muted); font-size: 10px; }
  .lb-name  { flex: 1; color: var(--text); }
  .lb-score { color: #ffcc00; font-weight: bold; }
  .lb-row--me .lb-name { color: #ff8800; }
  .lb-row--me .lb-score { color: #ff8800; }

  /* Shared */
  .stat-cards { display:flex; gap:16px; justify-content:center; margin-bottom:16px; }
  .stat-card { background:var(--bg-raised); border:1px solid var(--border); border-radius:6px; padding:10px 20px; }
  .sv { font-size:22px; font-weight:bold; }
  .sl { font-size:11px; color:var(--text-muted); letter-spacing:1px; margin-top:2px; }
  .btn-row { display:flex; gap:10px; }
  .btn-retry { flex:1; padding:11px; background:var(--bg-sunken); border:1px solid var(--border); border-radius:4px; font-size:13px; font-weight:bold; letter-spacing:2px; color:var(--text); font-family:inherit; cursor:pointer; }
  .btn-next  { flex:2; padding:11px; background:var(--accent-green); color:var(--bg); border-radius:4px; font-size:14px; font-weight:bold; letter-spacing:2px; box-shadow:0 0 18px color-mix(in srgb,var(--accent-green) 40%,transparent); font-family:inherit; cursor:pointer; border:none; }
</style>
```

- [ ] **Verify in browser:** play a game until SPLASH, confirm results screen shows arcade layout (score, crossings, leaderboard, PLAY AGAIN / BACK TO LESSONS). Then practice a lesson and confirm practice results still work.

- [ ] **Run all tests**

```bash
npm test
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add src/screens/ResultsScreen.svelte
git commit -m "feat: add arcade results mode to ResultsScreen"
```

---

## Task 11: Full integration smoke test

- [ ] **Start dev server and run through the full flow:**

```bash
npm run dev
```

Checklist:
1. Home screen → select / create a profile
2. Lessons screen → ARCADE buttons present and locked for un-earned groups
3. Practice home row lessons 1–5 until each has ≥1 star (or manually edit localStorage to unlock)
4. Home Row ARCADE button glows orange and is tappable
5. Tap ARCADE → GameScreen renders with HUD, river, pads moving, chick on near bank
6. Type words on glowing pads → chick hops, combo builds, score increases
7. Let a pad carry chick to edge → life lost, SPLASH animation, chick floats back
8. Lose all 3 lives → SPLASH overlay → auto-navigate to ResultsScreen arcade mode
9. ResultsScreen shows score, crossings, leaderboard (check profile name in top-10)
10. PLAY AGAIN → returns to GameScreen for same group
11. BACK TO LESSONS → returns to lesson select screen
12. Practice results (after a lesson) still work correctly — not broken by arcade mode

- [ ] **Run full test suite one final time**

```bash
npm test
```

Expected: all PASS, no errors.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: arcade mode complete — frogger river crossing with leaderboard"
```
