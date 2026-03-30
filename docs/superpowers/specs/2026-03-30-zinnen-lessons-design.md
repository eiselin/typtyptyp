# Zinnen Lessons — Shift, Capitals & Punctuation

**Date:** 2026-03-30
**Status:** Draft

---

## Overview

Add a fourth lesson group (`zinnen`) that teaches the Shift key, capital letters, and common punctuation. Exercises are pre-written sentences — Chick adventure stories and celebrations of the user's own typing skills — rather than generated word sequences. Both Dutch and English sentence sets are provided.

---

## Lesson Structure

Five new lessons appended to `LESSONS` in `src/lessons/index.js`:

| id | group  | keys              | label     | Introduces |
|----|--------|-------------------|-----------|------------|
| 14 | zinnen | `shift`, `.`      | `SHIFT .` | Capital letters and period — combined because a sentence without a period produces unreadable exercises |
| 15 | zinnen | `,`               | `,`       | Comma |
| 16 | zinnen | `?`, `!`          | `? !`     | Question mark and exclamation |
| 17 | zinnen | `:`, `;`          | `: ;`     | Colon and semicolon |
| 18 | zinnen | `"`, `'`          | `" '`     | Double and single quote |

Each lesson from 15 onward builds on sentences that already use capitals and periods, so later sentence sets freely include `.` and capitals alongside the newly introduced punctuation.

---

## Sentence Content

### Storage

`src/lessons/zinnen/nl.json` and `src/lessons/zinnen/en.json`. Each file is an object keyed by lesson id as a string:

```json
{
  "14": [
    "Kuiken typt heel snel.",
    "Jij bent een echte toptypist."
  ],
  "15": [
    "Kuiken pakt zijn rugzak, zijn kaart en zijn kompas.",
    "Jij typt snel, netjes en zonder fouten."
  ]
}
```

Each lesson contains **15–20 sentences**. Every sentence already carries its own terminal punctuation — no punctuation is added at join points during exercise assembly.

### Content guidelines

- **Chick adventures:** Chick explores forests, discovers treasures, meets animals, goes on expeditions, solves mysteries. Events should feel exciting and appropriate for kids aged 6–12.
- **User celebration:** Woven in naturally alongside Chick — sentences like "You type faster than Chick can run." These should feel genuine, not hollow.
- **Vocabulary:** Simple, common words throughout. Lesson 14 in particular should use short, familiar words since it is the first sentence exercise.
- **Sentence length:** 6–12 words. Longer sentences increase error rate frustration for kids.
- **No adult themes, no scary content, no complex jargon** (per CLAUDE.md).

### Exercise assembly

`buildSentenceSequence(sentences, targetLength)` — a new exported function in `src/words/index.js`:

1. Shuffle the sentence array (Fisher-Yates)
2. Cycle through sentences (wrapping if needed) until the running character count reaches `targetLength` (~200)
3. Join with a single space — sentences already contain terminal punctuation so no separator punctuation is added
4. Return the joined string

When `lesson.group === 'zinnen'`, `ExerciseScreen` calls `buildSentenceSequence` instead of `buildExerciseSequence`. The word generator is not involved.

---

## FINGER_MAP Extensions

`src/lessons/index.js`. Keys `.` and `,` are already present in `FINGER_MAP`; the following are new:

| Key       | Finger   | Physical key |
|-----------|----------|--------------|
| `'!'`     | `lp`     | Shift+1 |
| `'?'`     | `rp`     | Shift+/ |
| `':'`     | `rp`     | Shift+; |
| `'"'`     | `rp`     | Shift+' |
| `"'"`     | `rp`     | Right pinky (standalone) |
| `'shift_l'` | `lp`   | Left Shift key |
| `'shift_r'` | `rp`   | Right Shift key |

### Shift hand selection

`getShiftSide(char)` — a new exported helper in `src/lessons/index.js`. Rule: **left-hand characters use right shift; right-hand characters use left shift.** Determined by looking up the character's finger in FINGER_MAP:

- Finger starts with `'l'` (lp, lr, lm, li) → use `shift_r`
- Finger starts with `'r'` (ri, rm, rr, rp) → use `shift_l`
- Unknown character → `null` (no shift highlight)

---

## Exercise Screen Changes

**Sequence building:** When `lesson.group === 'zinnen'`, import and call `buildSentenceSequence(sentences, 200)` where `sentences` comes from `SENTENCE_LISTS[$lang][lesson.id]`.

**Keypress validation:** No change. `e.key` already yields `'K'` for Shift+k and `'?'` for Shift+/. The existing `e.key === sequence[cursor]` comparison and the `length !== 1` guard handle shifted characters correctly.

**Keyboard highlight:** Extended. When `sequence[cursor]` is uppercase or a shift-punctuation character (`! ? : " '`), highlight both the base key and the appropriate Shift key. The shift side is determined by `getShiftSide(sequence[cursor])`.

**Intro key cards:** Zinnen lessons display intro cards for newly introduced keys using the existing `LetterTiles` component. `'shift'` in `lesson.keys` renders as a wide tile labelled `SHIFT`. Punctuation keys render as normal tiles.

**HandHints:** When the active character requires Shift, render two finger hints simultaneously — one for the Shift key, one for the base key.

---

## Keyboard Component Changes

`src/components/Keyboard.svelte`:

- Add Shift keys on both ends of the bottom row, rendered as wider keys in the existing arcade neon style
- Extend the rendered rows to include punctuation keys present in zinnen exercises: `,` `.` `;` `'` `/` `1` (the physical keys from which `?` and `!` are derived via Shift)
- When a character requires Shift, both the Shift key and the base key are highlighted simultaneously with the existing glow effect

---

## LessonSelectScreen Changes

`src/screens/LessonSelectScreen.svelte`:

- Add `'zinnen'` to `GROUPS` and a corresponding entry in `GROUP_IDS` (`'sentences'`)
- Add a `NO_GAME_GROUPS` set (`new Set(['zinnen'])`); the game tile is rendered conditionally: `{#if !NO_GAME_GROUPS.has(group)}` — sentence exercises don't map cleanly to an infinite arcade mode
- `GROUP_LAST_LESSON` in `src/words/index.js` is unchanged — zinnen lessons do not affect word-based arcade games

---

## i18n

New translation keys:

- `en.json`: `"lessons.group.zinnen": "SENTENCES"`
- `nl.json`: `"lessons.group.zinnen": "ZINNEN"`

Individual zinnen lesson labels (`. ,` `? !` etc.) are rendered directly from `lesson.label` — no additional i18n keys needed.

---

## Testing

- Unit tests for `buildSentenceSequence`: correct target length, wraps when sentence count is low, handles single-sentence input
- Unit test: all lesson ids 14–18 have entries in both `nl.json` and `en.json` with at least 15 sentences each
- Unit test: `LESSONS` now has 18 entries
- Unit test: `getLearnedKeys(18)` includes all 26 letters and the new punctuation keys (`.` `,` `!` `?` `:` `;` `"` `'`)
- Unit test: `getShiftSide` returns correct shift side for a sample of left- and right-hand characters
- Existing 73 tests continue to pass unchanged
