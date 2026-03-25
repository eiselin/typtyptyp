# typtyptyp — Design Spec

**Date:** 2026-03-25
**Status:** Approved

## Overview

typtyptyp (named for the chirping of a small chick) is a Dutch-first touch typing web app for kids of all ages. It teaches blind typing (blind typen) through a classic key-progression curriculum, presented in a retro pixel-art arcade style with an animated chick mascot.

Goals: simple to use, engaging for kids, modern and polished, family-friendly.

---

## Stack

- **Framework**: Svelte + Vite
- **Styling**: CSS custom properties + Svelte scoped styles, no CSS framework
- **State**: Svelte stores (no router, no external state library)
- **Persistence**: localStorage (per-profile keys)
- **i18n**: reactive translation store, Dutch strings in `src/i18n/nl.json`; structured for additional languages
- **Dependencies**: minimal — no animation library, no router

---

## Architecture

Single-page app. One Svelte store holds `currentScreen` and `activeProfile`. Screens are components conditionally rendered with Svelte `fly`/`fade` transitions. No URL routing needed.

```
App
├── stores/
│   ├── screen.js       — currentScreen, selectedLesson
│   └── profiles.js     — profiles[], activeProfile, CRUD ops
├── screens/
│   ├── HomeScreen.svelte
│   ├── LessonSelectScreen.svelte
│   ├── ExerciseScreen.svelte
│   └── ResultsScreen.svelte
├── components/
│   ├── PixelChick.svelte     — chick sprite, accepts state prop
│   ├── Keyboard.svelte       — full keyboard, finger colour coding
│   ├── HandHints.svelte      — pixel art hands, active finger highlight
│   ├── LetterTiles.svelte    — target text tiles
│   └── ProfileCard.svelte    — home screen profile selector
├── i18n/
│   └── nl.json
├── lessons/
│   └── index.js              — lesson definitions + key sets
└── words/
    └── nl.json               — filtered Dutch word list (~5–10k words)
```

---

## Screens

### 1. Startscherm (Home)

- Animated pixel art chick (bob animation)
- Logo: TYPTYPTYP in three neon colours
- Tagline: "Leer blind typen"
- **Profile picker**: list of saved profiles, each showing name, progress bar, lesson count, star rating. Tap to select.
- "Nieuw profiel" card (dashed border) opens a name-entry input
- Selected profile's name appears in the START button: "▶ VERDER ALS [NAAM]"
- Language selector: Dutch active, other languages shown as greyed-out stubs

### 2. Lessenrooster (Lesson Select)

- Grid of lesson cards, organised by row group (Thuisrij, Bovenrij, Onderrij, Cijfers, Volledig)
- Each card shows: key pair (e.g. "F J"), finger label, star rating (0–3), lock state
- States: completed (green border + stars), available (cyan border + glow + "▶ SPELEN"), locked (dimmed + lock icon)
- Lesson 1 is unlocked by default. Every subsequent lesson (2–20) unlocks when the immediately preceding lesson (N-1) has been completed with at least 1 star. Progression is strictly linear — lesson 6 requires lesson 5, regardless of row group boundaries.
- Back button returns to Home

### 3. Oefenscherm (Exercise)

- **Progress bar** at top with lesson label and count (e.g. "4 / 12")
- **Pixel chick** (small, left-aligned) animates based on typing state:
  - Idle: gentle bob
  - Correct keypress: fast bob, wings up, star eye — a `state` prop is set to `'happy'` via a Svelte store; a `setTimeout` of 600ms in `PixelChick.svelte` resets it to `'idle'`
  - Wrong keypress: horizontal shake, X eyes, drooped wings — same mechanism, `'error'` state resets to `'idle'` after 600ms
- **Letter tiles**: target characters shown as individual tiles. Done tiles: dimmed green. Active tile: neon glow in the finger colour of the key required to type that character (e.g. if next key is J, tile glows cyan — right index). Pending tiles: dark/invisible. Each tile's finger colour is pre-computed from the lesson's key-to-finger mapping.
- **Keyboard** (always visible):
  - Full QWERTY layout, colour-coded by finger (8 colours)
  - Rows not yet in scope for this lesson are dimmed (opacity ~0.3)
  - Active key: the single key corresponding to the next character in the sequence — bright, glowing, in that key's finger colour. Only one key is active at a time.
  - Typed keys: briefly flash correct (green) or wrong (red)
- **Hand hints** (above keyboard):
  - Pixel art left and right hand, fingers as coloured columns
  - Inactive fingers: dimmed (opacity ~0.3)
  - Active finger: full brightness, glow animation
  - Centre label: finger name in Dutch ("LINKER RINGVINGER") — updates whenever the required finger changes (i.e. when the next character requires a different finger than the previous one)
- Stats bar at bottom: nauwkeurigheid (accuracy), woorden/min (WPM)
- Back button exits to lesson select (with confirmation if mid-exercise)

### 4. Resultaten (Results)

- Pixel confetti (CSS-animated coloured squares)
- Happy chick (fast bob, wings raised, star eye)
- Stars earned (1–3), animated pop-in
  - 3 stars: ≥95% accuracy
  - 2 stars: ≥80% accuracy
  - 1 star: completed
- Stats: accuracy percentage, WPM
- Two buttons: "↺ OPNIEUW" (retry), "VOLGENDE LES ▶" (advance)
- Progress saved to localStorage before this screen renders

---

## Visual Design

### Theme: Retro Pixel Arcade

- **Background**: deep purple `#12082a`
- **Primary accent**: neon cyan `#00ffee`
- **Secondary accent**: neon green `#00ff88`
- **Tertiary accent**: neon yellow `#ffcc00`
- **Borders**: 2–3px solid neon, with subtle glow `box-shadow`
- **Scanline overlay**: `repeating-linear-gradient` pseudo-element on screen containers
- **Typography**: `'Courier New', monospace` throughout
- **Letter spacing**: generous (2–4px) for headers
- **Border radius**: small (3–6px) — crisp, not round

### Finger Colour System

8 neon colours, one per finger, consistent across keyboard keys, hand hints, and letter tiles:

| Finger | Colour | Hex |
|---|---|---|
| Left pinky | Hot pink | `#ff4488` |
| Left ring | Orange | `#ff8844` |
| Left middle | Yellow | `#ffcc00` |
| Left index | Green | `#44ff88` |
| Right index | Cyan | `#00ffee` |
| Right middle | Blue | `#4488ff` |
| Right ring | Purple | `#aa44ff` |
| Right pinky | Magenta | `#ff44ff` |

### Pixel Art Chick

SVG-based pixel art sprite, `image-rendering: pixelated`. Three states, swapped via Svelte reactive prop:

- **idle**: gentle bob (CSS keyframe, 2s)
- **happy**: fast bob (0.4s), wings raised, star eye — triggered on correct keypress, returns to idle after 600ms
- **error**: horizontal shake, X eyes, drooped wings — triggered on wrong keypress, returns to idle after 600ms

---

## Lesson Curriculum

### Progression

| Group | Lessons | Keys introduced |
|---|---|---|
| Thuisrij | 1–5 | F J → D K → S L → A ; → full home row |
| Bovenrij | 6–10 | R U → E I → W O → Q P → full top row |
| Onderrij | 11–14 | V M → C , → X . → Z / |
| Cijfers | 15–18 | 4 7 → 3 8 → 2 9 → 1 0 |
| Volledig | 19–20 | All keys combined |

Each lesson has multiple rounds of increasing difficulty:
1. Isolated key pairs (e.g. `f j f j j f`)
2. Short nonsense sequences (e.g. `fjfj jfjf ffjj`)
3. Real words using only learned keys (once pool ≥ 50 words)

### Star Scoring

- 3 stars: ≥95% accuracy
- 2 stars: ≥80% accuracy
- 1 star: lesson completed
- 0 stars / locked: not yet attempted

---

## Word System

### Source

OpenTaal Dutch word list (open-source, MIT/LGPL licensed). Filtered down to a bundled `src/words/nl.json`.

### Filtering Pipeline (build-time script)

1. Start with OpenTaal full list (~200k words)
2. Remove proper nouns (capitalised entries)
3. Filter by frequency: keep top ~15k most common Dutch words
4. Apply profanity blocklist (Dutch profanity list, open-source)
5. Apply semantic blocklist: words related to death, violence, illness, threats, weapons, drugs (curated Dutch terms list)
6. Result: ~5,000–10,000 family-friendly common Dutch words

### Runtime Filtering

At the start of each lesson, the word pool is filtered to words that only contain keys the student has learned so far (case-insensitive). If the resulting pool has fewer than 50 words, the lesson falls back to procedurally generated nonsense sequences using learned keys.

### Nonsense Sequence Generation

For early lessons: generate rhythmic character sequences using only the current lesson's key set. Patterns include alternating, mirrored, and random-within-keys sequences. Sequences feel structured, not random — e.g. `ffjj`, `fjfj`, `jjff`, `fjjf`.

---

## Multi-User Profiles

- Profiles stored in localStorage under `typtyptyp_profiles` (array of profile objects)
- Each profile: `{ id, name, colour, createdAt, lessonProgress: { [lessonId]: { stars, bestAccuracy, bestWpm } } }`
- `colour` is auto-assigned from a fixed palette of 8 neon values (cycling if more than 8 profiles exist): `['#00ffee','#00ff88','#ffcc00','#ff4488','#4488ff','#ff8844','#aa44ff','#ff44ff']`. It is used as the avatar background-tint and accent colour on the profile card — not user-selectable.
- Home screen lists all profiles; tap to select active profile
- Active profile ID stored in `sessionStorage` (resets on browser close — intentional, so the next person opening the app picks their own profile)
- "Nieuw profiel" prompts for a name; duplicate names are rejected with an inline error
- Profiles can be deleted (long-press / settings icon, with confirmation)

---

## i18n

All user-facing strings sourced from `src/i18n/nl.json`. A reactive `t()` store function returns the string for the active language. Additional language files (`en.json`, etc.) can be added without code changes. Language selector on home screen persists to localStorage.

---

## Error Handling

- Wrong keypress: chick error state + tile flashes red + key flashes red. No penalty beyond accuracy score — keeps it encouraging.
- localStorage unavailable (private browsing): app functions without persistence; a banner informs the user that progress won't be saved.
- Word list empty for current keys: falls back to nonsense sequences silently.

---

## Out of Scope (v1)

- Backend / accounts
- Sound effects (may add in v2)
- Mobile / touchscreen keyboard support
- Multiplayer / competitive modes
- Uppercase letters / shift key (v2)
- Punctuation lessons beyond home row symbols
