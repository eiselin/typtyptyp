# Stats & Feedback Design

## Goal

Make learning progress visible and meaningful for kids by standardising WPM, tracking typing mistakes, surfacing personal bests on lesson cards, and adding a My Progress screen.

## Context

typtyptyp is a kids touch-typing app (Svelte 4/5, localStorage persistence). Profiles are stored in `src/stores/profiles.js`. Lesson progress is stored per-profile as `lessonProgress[lessonId] = { stars, bestAccuracy, bestWpm }`. The exercise screen is `src/screens/ExerciseScreen.svelte` (Svelte 5 runes, has `<svelte:options runes={true}>`). Lesson select is `src/screens/LessonSelectScreen.svelte` (Svelte 4 style).

---

## 1. WPM — Standard Formula

**Problem:** The current formula counts actual words divided by elapsed time, which is non-standard and produces inconsistent results depending on word length.

**Solution:** Use the industry-standard net WPM formula:

```
net WPM = (characters typed / 5) / minutes
```

One "word" = 5 characters. **Spaces are counted as characters** — they are typed characters and the 5-char standard includes them. This is consistent with how Monkeytype, Typeracer, and typing education curricula define WPM.

**Implementation:** In `ExerciseScreen.svelte` `finish()`, replace only the `wpm` line (`const mins` already exists in the function and is unchanged):

```js
// Before:
const wpm = Math.round(sequence.trim().split(' ').length / mins)

// After:
const wpm = Math.round((sequence.length / 5) / mins)
```

`sequence.length` includes spaces. At exercise completion `cursor === sequence.length` (all characters correctly typed), so this equals correctly typed characters / 5 / minutes. Timer starts on first keypress (`startTime` set in `handleKeydown`), ends when `finish()` is called. No pause exclusion.

---

## 2. Mistake Tracking

**Problem:** The app counts errors as a total but discards what was typed incorrectly, making it impossible to identify which keys a kid struggles with.

**Solution:** Record each wrong keypress as `{ expected, typed }` during the exercise. After the exercise, aggregate into a `mistakes` object and persist it to the profile.

### Data shape

```js
profile.lessonMistakes = {
  [lessonId]: {
    [expectedKey]: {
      [typedKey]: count
    }
  }
}
```

Example: `lessonMistakes[3]['k']['i'] = 7` means the kid typed "i" when "k" was expected, 7 times in lesson 3.

### Collection in ExerciseScreen.svelte

Maintain a local array during the exercise (add alongside existing state):

```js
let mistakeLog = $state([])  // { expected: string, typed: string }[]
```

On wrong keypress (inside `handleKeydown`, where `errors++` is currently called):

```js
errors++
mistakeLog = [...mistakeLog, { expected: sequence[cursor], typed: e.key }]
```

Before calling `updateProgress()` in `finish()`, aggregate:

```js
const mistakes = {}
for (const { expected, typed } of mistakeLog) {
  mistakes[expected] ??= {}
  mistakes[expected][typed] = (mistakes[expected][typed] ?? 0) + 1
}
```

Then pass `mistakes` to `updateProgress()`.

### Profile store — updateProgress()

Extend the signature: `updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm, mistakes })`.

Full updated implementation in `profiles.js`:

```js
export function updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm, mistakes = {} }) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.lessonProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }

    // Merge mistake counts
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

### createProfile initial shape

Add `lessonMistakes: {}` to the profile object in `createProfile()`:

```js
const profile = {
  id: crypto.randomUUID(),
  name: trimmed,
  colour: PROFILE_COLOURS[ps.length % PROFILE_COLOURS.length],
  createdAt: Date.now(),
  lessonProgress: {},
  lessonMistakes: {},   // ← add this
}
```

---

## 3. Lesson Cards — Show Bests

**Problem:** Stars are earned once and never update; WPM and accuracy are stored but never shown, so there is no personal record to beat.

**Solution:** Done lesson cards in `LessonSelectScreen.svelte` show a small additional line below the stars with best WPM and best accuracy.

```
F J
★★★
48 WPM · 97%   ← new, small muted text
```

Only shown when `bestWpm > 0`. Uses already-stored values from `lessonProgress[lesson.id].bestWpm` and `lessonProgress[lesson.id].bestAccuracy`. The stat line uses hardcoded `WPM` and `%` — both are universally understood abbreviations that need no translation.

---

## 4. My Progress Screen

New screen `src/screens/ProgressScreen.svelte`. **Use Svelte 4 style** (reactive declarations `$:`, `on:click`) to stay consistent with `LessonSelectScreen.svelte` and other non-exercise screens.

Reachable via a `PROGRESS →` button in the lesson select topbar (top-right). The topbar currently holds three items: back button, title, subtitle ("LESSONS"). **Replace the subtitle with the PROGRESS button** — the title already identifies the screen.

Only rendered when a profile is active (`$activeProfile !== null`).

### Section 1 — Your Trickiest Keys

Aggregate `$activeProfile.lessonMistakes` across all lessons. For each expected key, sum total mistake counts across all typed variants and all lessons. **Exclude the space character** (`' '`) — it is confusing and unhelpful to tell a kid that space is their trickiest key.

Sort by total count descending. Show **up to 3** cards — if fewer than 3 keys have any recorded mistakes, show only however many exist (1 or 2 cards). Do not show placeholder cards.

Each card:
- Key character (uppercase) in the finger color: use `FINGER_VARS[getFingerForKey(key)]` as a CSS variable via `style="--kc: {color}"`, then `color: var(--kc)` and `border-color: var(--kc)` — exactly as `ExerciseScreen` does for intro key cards.
- Below the key: most common wrong key for that expected key, e.g. "often type I instead"

If `lessonMistakes` is empty across all lessons: show an encouraging placeholder — "Play some lessons to see your trickiest keys!"

### Section 2 — Lessons

Scrollable list of all 15 lessons in `LESSONS` order (import from `src/lessons/index.js`). Each row:
- Lesson label (e.g. "F J", "D K") or `$t('lessons.label.volledig')` for lesson 15
- Stars (e.g. `★★☆`) if completed; `- - -` if locked
- Best WPM and accuracy if `bestWpm > 0` (e.g. `48 WPM · 97%`); empty otherwise

Tapping a completed or available row calls `selectLesson(lesson.id)`. **`selectLesson` handles the screen transition internally** — it sets `$selectedLesson` and calls `screen.set('exercise')`. No additional `goTo('exercise')` call needed from ProgressScreen.

Locked rows are not tappable.

### Navigation

`← BACK` calls `goTo('lessons')`. No additional store state needed.

---

## 5. Navigation & Routing

- `src/stores/screen.js` — no change needed; screen is a plain writable string
- `src/App.svelte` — add routing: `{:else if $screen === 'progress'}<ProgressScreen />{/if}`
- `src/screens/LessonSelectScreen.svelte` — in topbar, replace the `<span class="sub">` subtitle with a `PROGRESS →` button that calls `goTo('progress')`; only show when `$activeProfile !== null`

---

## i18n Keys

New keys in `src/i18n/en.json` and `src/i18n/nl.json`. **Reuse `lessons.title`** ("LESSONS" / "LESSEN") for the lesson section heading in ProgressScreen — no new key needed.

| Key | English | Dutch |
|-----|---------|-------|
| `progress.title` | `MY PROGRESS` | `MIJN VOORTGANG` |
| `progress.trickiest` | `YOUR TRICKIEST KEYS` | `JOUW MOEILIJKSTE TOETSEN` |
| `progress.oftenType` | `often type {typed} instead` | `je typt vaak {typed} in plaats daarvan` |
| `progress.noMistakes` | `Play some lessons to see your trickiest keys!` | `Speel wat lessen om je moeilijkste toetsen te zien!` |
| `lessons.progress` | `PROGRESS →` | `VOORTGANG →` |

---

## Known Limitations

- **Mistake data grows unboundedly.** Counts accumulate per lesson per profile and are never pruned. This is acceptable for the current scale (15 lessons, localStorage) but noted for future consideration.

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/profiles.js` | Extend `updateProgress()` with mistakes merge; add `lessonMistakes: {}` to `createProfile` |
| `src/screens/ExerciseScreen.svelte` | New WPM formula; mistake collection (`mistakeLog`); pass `mistakes` to `updateProgress` |
| `src/screens/LessonSelectScreen.svelte` | WPM/accuracy on done cards; replace subtitle with `PROGRESS →` button |
| `src/screens/ProgressScreen.svelte` | New screen (Svelte 4 style) |
| `src/App.svelte` | Route `'progress'` screen |
| `src/i18n/en.json` | Add 5 new keys |
| `src/i18n/nl.json` | Add 5 new keys |
