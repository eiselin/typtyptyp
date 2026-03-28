# Stats & Feedback Design

## Goal

Make learning progress visible and meaningful for kids by standardising WPM, tracking typing mistakes, surfacing personal bests on lesson cards, and adding a My Progress screen.

## Context

typtyptyp is a kids touch-typing app (Svelte 4/5, localStorage persistence). Profiles are stored in `src/stores/profiles.js`. Lesson progress is stored per-profile as `lessonProgress[lessonId] = { stars, bestAccuracy, bestWpm }`. The exercise screen is `src/screens/ExerciseScreen.svelte`. Lesson select is `src/screens/LessonSelectScreen.svelte`.

---

## 1. WPM — Standard Formula

**Problem:** The current formula counts actual words divided by elapsed time, which is non-standard and produces inconsistent results depending on word length.

**Solution:** Use the industry-standard net WPM formula:

```
net WPM = (correctly typed characters / 5) / minutes
```

One "word" = 5 characters, regardless of actual word length. This is the formula used by Monkeytype, Typeracer, 10FastFingers, and typing education curricula.

**Implementation:** In `ExerciseScreen.svelte` `finish()`:
```js
const mins = Math.max((Date.now() - startTime) / 60000, 1 / 60)
const wpm  = Math.round((sequence.length / 5) / mins)
```

At exercise completion `cursor === sequence.length`, so `sequence.length` equals correctly typed characters. Timer starts on first keypress (`startTime` set in `handleKeydown`), ends when `finish()` is called.

No pause exclusion — pauses are part of real typing speed and excluding them would inflate scores inconsistently with industry standards.

---

## 2. Mistake Tracking

**Problem:** The app counts errors as a total but discards what was typed incorrectly, making it impossible to identify which keys a kid struggles with.

**Solution:** Record each wrong keypress as `{ expected, typed }` during the exercise. After the exercise, aggregate into a `mistakes` object and persist it to the profile.

### Data shape

Per-lesson mistake counts stored in the profile:

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

### Collection

In `ExerciseScreen.svelte`, maintain a local array during the exercise:
```js
let mistakeLog = []  // { expected: string, typed: string }[]
```

On wrong keypress:
```js
mistakeLog.push({ expected: sequence[cursor], typed: e.key })
```

Before calling `updateProgress()`, aggregate:
```js
const mistakes = {}
for (const { expected, typed } of mistakeLog) {
  mistakes[expected] ??= {}
  mistakes[expected][typed] = (mistakes[expected][typed] ?? 0) + 1
}
```

### Profile store

`updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm, mistakes })` in `profiles.js` merges mistake counts:

```js
const prevMistakes = p.lessonMistakes?.[lessonId] ?? {}
const mergedMistakes = { ...prevMistakes }
for (const [expected, typedMap] of Object.entries(mistakes ?? {})) {
  mergedMistakes[expected] ??= {}
  for (const [typed, count] of Object.entries(typedMap)) {
    mergedMistakes[expected][typed] = (mergedMistakes[expected][typed] ?? 0) + count
  }
}
```

Stored under `profile.lessonMistakes[lessonId]`.

---

## 3. Lesson Cards — Show Bests

**Problem:** Stars are earned once and never update; WPM and accuracy are stored but never shown after the lesson, so there is no personal record to beat.

**Solution:** Done lesson cards in `LessonSelectScreen.svelte` show a second line with best WPM and best accuracy, using already-stored values from `lessonProgress`.

**Layout addition to done cards:**
```
F J
★★★
48 WPM · 97%   ← new, small muted text
```

Only shown when `bestWpm > 0`.

---

## 4. My Progress Screen

New screen `src/screens/ProgressScreen.svelte`. Reachable via a `PROGRESS →` button in the lesson select topbar (top-right corner, next to the TYPTYPTYP title). Only rendered when a profile is active.

### Section 1 — Your Trickiest Keys

Aggregate `lessonMistakes` across all lessons for the active profile. For each expected key, sum total mistake count across all typed-key variants and all lessons. Take the top 3.

Display as colored key cards using `FINGER_VARS` from `src/lessons/index.js`. Under each key, show the most common wrong key: "you often type X instead."

If no mistakes have been recorded yet (new profile), show an encouraging placeholder: "Play some lessons to see your trickiest keys!"

### Section 2 — Lessons

Scrollable list of all 15 lessons in `LESSONS` order. Each row:
- Lesson label (e.g. "F J", "D K")
- Stars (★★☆ or ☆☆☆)
- Best WPM and accuracy if completed (e.g. `48 WPM · 97%`)
- Locked lessons: dimmed, dashes instead of stats

Tapping a completed or available row calls `selectLesson(lesson.id)` to start that exercise directly.

### Navigation

`← BACK` calls `goTo('lessons')`. No additional store state needed.

---

## 5. Navigation & Routing

- `src/stores/screen.js` — add `'progress'` as a valid screen name (no code change needed, screen store is a plain writable string)
- `src/App.svelte` — add `{:else if $screen === 'progress'}<ProgressScreen />{/if}`
- `src/screens/LessonSelectScreen.svelte` — add `PROGRESS →` button to topbar, calls `goTo('progress')`

---

## i18n Keys

New keys needed in `src/i18n/en.json` and `src/i18n/nl.json`:

| Key | English | Dutch |
|-----|---------|-------|
| `progress.title` | `MY PROGRESS` | `MIJN VOORTGANG` |
| `progress.trickiest` | `YOUR TRICKIEST KEYS` | `JOUW MOEILIJKSTE TOETSEN` |
| `progress.oftenType` | `often type {typed} instead` | `typt vaak {typed} in plaats daarvan` |
| `progress.noMistakes` | `Play some lessons to see your trickiest keys!` | `Speel wat lessen om je moeilijkste toetsen te zien!` |
| `progress.lessons` | `LESSONS` | `LESSEN` |
| `lessons.progress` | `PROGRESS →` | `VOORTGANG →` |

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/profiles.js` | Extend `updateProgress()` to accept and merge `mistakes` |
| `src/screens/ExerciseScreen.svelte` | New WPM formula, mistake collection, pass mistakes to updateProgress |
| `src/screens/LessonSelectScreen.svelte` | WPM/accuracy on done cards, PROGRESS → button in topbar |
| `src/screens/ProgressScreen.svelte` | New screen |
| `src/App.svelte` | Route `'progress'` screen |
| `src/i18n/en.json` | Add progress keys |
| `src/i18n/nl.json` | Add progress keys |
