# Open Progression — Design Spec

## Overview

Remove all lesson and game unlock gates. Every lesson and every arcade game is always playable. Replace the lock/unlock visual system with three meaningful tile states: Completed, Recommended, and Unplayed. The Coach screen and lesson select screen share a single recommendation algorithm so they always agree on which lesson to focus on next.

---

## Lesson Tile States

All lesson tiles are always playable. The `state()` function in `LessonSelectScreen.svelte` is replaced with a three-value system:

| State | Condition | Appearance |
|---|---|---|
| `completed` | `lessonProgress[id].stars >= 1` | Green, star count shown (existing "done" style) |
| `recommended` | The one lesson identified by the recommendation algorithm | Neon yellow glow, "NEXT" label replacing the `▶` in the existing `lstate` div |
| `unplayed` | 0 stars, not recommended | Dim/neutral, subdued appearance |

Exactly one lesson tile carries the `recommended` state at any time.

The existing `?unlock` dev shortcut becomes a no-op (everything is always playable) and should be removed.

---

## Recommendation Algorithm

A shared pure function `getRecommendedLesson(profile, lessons)` is exported from `src/lessons/index.js`. It is used by both `LessonSelectScreen.svelte` and `ProgressScreen.svelte`.

### Inputs
- `profile` — the active profile object with shape:
  - `lessonProgress: { [lessonId]: { stars: number, bestAccuracy: number, bestWpm: number } }` — `bestAccuracy` is a 0–100 number already stored by `updateProgress` in `profiles.js`
  - `keyStats: { [key: string]: boolean[] }` — rolling array of booleans (true = correct, false = incorrect); length = number of presses; already stored per key
- `lessons` — the full LESSONS array from `src/lessons/index.js`

### Logic (in order)

**Step 1 — No data yet:** If `keyStats` is empty or no key has ≥5 presses recorded, return `lessons[0]` (Lesson 1).

**Step 2 — Find lowest lesson with a struggling key:** Scan lessons in order (1 → 15). For each lesson at index `i`, compute its newly introduced keys as:

```
newKeys = getLearnedKeys(lesson.id) minus getLearnedKeys(i > 0 ? lessons[i-1].id : 0)
```

For Lesson 1 (i = 0), use `getLearnedKeys(0)` for the previous set — this returns an empty array, so all keys in Lesson 1 are treated as newly introduced. `getLearnedKeys(0)` works correctly because the existing loop breaks before adding anything when `lessonId = 0`.

**Note on review lessons:** Lessons 5, 10, and 15 are review/full-row lessons whose `keys` arrays are supersets of earlier lessons — they introduce zero new keys by the subtraction definition. They are intentionally skipped in Step 2. Their keys will have already been flagged by the lesson that first introduced them (e.g., if 'a' is struggling, Lesson 4 is returned, not Lesson 5). Review lessons are handled by Steps 3 and 4.

For each newly introduced key, compute `accuracy = keyStats[key].filter(Boolean).length / keyStats[key].length`. If the key has ≥5 presses and accuracy < 0.95, return that lesson immediately.

**Step 3 — Find lowest unplayed lesson:** If no lesson has a struggling key, scan lessons in order and return the first with `(lessonProgress[id]?.stars ?? 0) === 0`.

**Step 4 — All lessons played, all keys good:** Return the lesson with the lowest `lessonProgress[id].bestAccuracy` across all lessons (most room to improve). Since every lesson is always playable and `bestAccuracy` is stored after every completed exercise, this always finds a result.

### Output
A single lesson object. Steps 1–4 are exhaustive — the function always returns a lesson.

---

## Game Tiles

Remove the group-completion unlock check from `LessonSelectScreen.svelte`. All four game tiles are always in the available/playable state. No visual change to game tiles is needed.

---

## Coach Screen (ProgressScreen)

The "practice" button already finds the lesson containing the worst key. Replace that ad-hoc lookup with `getRecommendedLesson(profile, LESSONS)` so the Coach screen and lesson select screen always agree.

No other changes to ProgressScreen layout or coach messages.

---

## Files Changed

| File | Change |
|---|---|
| `src/lessons/index.js` | Export `getRecommendedLesson(profile, lessons)` |
| `src/screens/LessonSelectScreen.svelte` | Replace `state()` with 3-state system; remove game unlock gate; remove `?unlock` dev shortcut; use `getRecommendedLesson` |
| `src/screens/ProgressScreen.svelte` | Replace practice-lesson lookup with `getRecommendedLesson` |
| `tests/lessons/lessons.test.js` | Add tests for `getRecommendedLesson` |

---

## Out of Scope

- Changing lesson content, order, or grouping
- Changing the star threshold (1 star = completed)
- Changing coach messages or keyboard heatmap
- Adding per-lesson "recommended" indicators to the coach screen keyboard view
