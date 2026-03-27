# Arcade Mode — Design Spec
**Date:** 2026-03-27
**Status:** Draft

---

## Overview

A Frogger-style arcade game where the pixel chick hops across a neon river on glowing lily pads. Players type words to jump from pad to pad. The river speeds up over time. Survival pressure (3 lives) combines with a combo multiplier to create a high-score chase. Kids compete against their own personal bests and a shared device-wide leaderboard.

---

## Core Values

- **Kids-proof:** No hard failure states that feel punishing. Losing a life triggers a funny chick reaction (splash + float back), not a scary screen. Language is warm and encouraging throughout.
- **Arcade neon pixel art:** Dark backgrounds, glowing cyan/orange neon accents, pixel art chick (chunky front-facing, 9×12 grid), scanline shimmer on the river (reusing the existing project-wide scanline pattern), chunky pixel hearts for lives.

---

## Game Mechanics

### The river

- 5 lanes of water to cross per round.
- Lanes alternate direction (lane 1: left→right, lane 2: right→left, etc.).
- Each lane has 2–4 lily pads moving at the current river speed.
- Each pad shows a word drawn from the active lesson group's word pool.
- Pads are pre-loaded with the next word in sequence as they enter from the edge.

### Round start

- When a round begins, the chick stands on the near bank.
- The first pad to pass within "hop range" (roughly 1/3 of the lane from the bank side) is highlighted as the glowing pad.
- The player can wait as long as needed on a bank — there is no timer on safe ground.

### Glowing pad (next hop target)

- Only one pad glows at a time: the best reachable pad in the next lane up.
- **Selection rule:** the glowing pad is the pad in the next lane that is currently most centred horizontally (closest to middle of the screen). If two pads are equidistant, prefer the one moving toward centre.
- If no pad in the next lane is currently on screen, the player waits on their current pad (or bank) until one enters. No life is lost for waiting — only for drifting off the edge.
- The glowing pad updates automatically as pads move, always pointing to the best current option.

### Chick movement

- Type the glowing pad's word correctly → chick leaps onto it and rides it.
- While riding, the chick drifts with the pad. The next glowing pad (in the lane above) is highlighted immediately.
- Type the next glowing pad's word to hop again.
- Reach the far bank (top) = complete a crossing → score bonus + neon fanfare + next round begins faster.

### Survival rule

- If the pad the chick is riding drifts within 2 pad-widths of the edge, the pad flashes red as a warning.
- If the pad reaches the edge before the player hops off → lose 1 life.
- On life lost: chick does a funny splash animation, floats back to the last safe bank on a rubber duck (kids-proof: silly, not scary), river briefly freezes (1 second), then resumes.
- 3 lives total (displayed as pixel hearts in the HUD). All 3 lost → end of game (see End of Game).

### Wrong key

- Wrong keypress → chick wobbles/shakes, combo resets to 0. No life lost. Player retypes the word from the beginning.
- Combo loss on typo is intentional — it rewards accuracy — but is flagged for playtesting with kids to verify it doesn't feel frustrating.

### Glowing pad changes mid-word

- If the glowing pad changes while the player has partially typed a word (because a different pad moved to the most-centred position), the typed input resets to empty and the new glowing pad's word becomes the active target. No life is lost.

### Speed progression

- River speed is a number from 1.0 to 3.0, referred to as `speed_factor` throughout.
- `speed_factor` starts at 1.0 and increases by +0.1 on every **successful crossing** only. It does **not** increase on life lost (to avoid punishing struggling players).
- A speed bar in the HUD shows current danger level with colour thresholds: cyan below 1.5, orange 1.5–2.5, red above 2.5.
- Speed is capped at 3.0.

### Combo & scoring

```
combo:           increments +1 per correct character; resets to 0 on wrong key or glowing pad change.
                 Combo is continuous across words — it does NOT reset at word boundaries.
                 This means a player can build a high multiplier by chaining many words correctly.
multiplier:      floor(combo / 5) + 1, capped at ×10.
                 The multiplier value at the moment the word is completed is used for that word's score.

word_score:      word_length × multiplier × speed_factor
crossing_bonus:  500 × speed_factor  (on reaching far bank)
```

`speed_factor` is the current river speed value (1.0–3.0 as defined above).

---

## End of Game

When all 3 lives are lost:
- A warm full-screen overlay appears (not a separate screen): large pixel chick in splash state, text reads **"SPLASH!"** (not "GAME OVER"), final score shown with neon glow.
- After 2 seconds (or on any keypress), transitions to `ResultsScreen` in arcade mode.

### Arcade ResultsScreen

Displays:
- Final score (large, neon)
- Personal best for this group (before and after, with a "NEW BEST!" fanfare if beaten)
- Device leaderboard: full top 10, with the player's new entry highlighted
- Crossings completed
- A "PLAY AGAIN" button and a "BACK TO LESSONS" button

---

## Unlock Model

Arcade mode is milestone-gated by practice row completion. The dependency chain is linear:

| Row group  | Requires                        | Arcade unlocks    |
|------------|---------------------------------|-------------------|
| Home Row   | Lessons 1–5 (≥1 star each)     | Home Row arcade   |
| Top Row    | Lessons 6–10 (≥1 star each)    | Top Row arcade    |
| Bottom Row | Lessons 11–14 (≥1 star each)   | Bottom Row arcade |
| All Keys   | Lesson 15 (≥1 star)            | All Keys arcade   |

Note: the bottom row group has 4 lessons (11–14) and lesson 15 stands alone as the "All Keys" group. This asymmetry is intentional and matches the existing lesson structure.

---

## Word Pool

- Uses existing `buildExerciseSequence()` logic, filtered to learned keys for the selected group.
- Words cycle (shuffle + cycle, no repeats until pool exhausted).
- Pads are pre-loaded with the next word from the sequence as they enter from the screen edge.

---

## Entry Point

On `LessonSelectScreen`, each row group gains an **ARCADE** button directly below its lesson grid:

- **Unlocked:** glowing orange border, tappable. `🕹 ARCADE`
- **Locked:** greyed out, not tappable. `🔒 ARCADE` (no tooltip needed — kids understand the lock visual)

Tapping an unlocked ARCADE button navigates to `GameScreen` with `selectedGroup` set.

Input is physical keyboard only — consistent with the rest of the app.

---

## Navigation Flow

```
LessonSelectScreen
  └─ tap ARCADE (unlocked group) → sets selectedGroup in screen.js
       └─ GameScreen  (game loop)
            └─ all lives lost → SPLASH overlay → ResultsScreen (arcade mode)
                 └─ PLAY AGAIN → GameScreen (selectedGroup unchanged — same group replays)
                 └─ BACK TO LESSONS → LessonSelectScreen
```

---

## New Files

| File | Purpose |
|------|---------|
| `src/screens/GameScreen.svelte` | Full game loop: river rendering, pad movement, chick animation, input handling, HUD. Uses Svelte 5 runes (matching ExerciseScreen). |
| `src/stores/game.js` | Reactive game state: lives, score, combo, speed_factor, lane/pad positions, current word, round count |
| `src/stores/leaderboard.js` | Device-wide top 10 (localStorage key: `typtyptyp_leaderboard`). Entries persist even if the associated profile is later deleted — the name is stored as a plain string. |

### Existing files modified

| File | Change |
|------|--------|
| `src/stores/screen.js` | Add `game` route + `selectedGroup` param (string: `home` \| `top` \| `bottom` \| `all`) |
| `src/stores/profiles.js` | Add `arcadeProgress[groupId] = { highScore, achievedAt }` per profile |
| `src/screens/LessonSelectScreen.svelte` | Add ARCADE button per row group |
| `src/screens/ResultsScreen.svelte` | Add arcade results mode (conditional on a `mode` prop or store flag): show score, personal best diff, leaderboard, PLAY AGAIN + BACK TO LESSONS buttons |
| `src/i18n/nl.json` + `en.json` | Add arcade mode UI strings (ARCADE, SPLASH!, NEW BEST!, PLAY AGAIN, BACK TO LESSONS, SCORE, COMBO, LIVES, BEST, RIVER SPEED) |

---

## Data Model

### Profile extension (`profiles.js`)

```js
profile.arcadeProgress = {
  home:   { highScore: 4820, achievedAt: 1711123200000 },
  top:    { highScore: 0,    achievedAt: null },
  bottom: { highScore: 0,    achievedAt: null },
  all:    { highScore: 0,    achievedAt: null },
}
```

### Device leaderboard (`localStorage` key: `typtyptyp_leaderboard`)

```js
// Array of up to 10 entries, sorted by score descending
[
  { profileName: "Emma", score: 9240, groupId: "home", achievedAt: 1711123200000 },
  { profileName: "Lars",  score: 7110, groupId: "top",  achievedAt: 1711100000000 },
]
```

A new score is added if it is strictly higher than the lowest entry (or the list has fewer than 10 entries). On an exact tie with the 10th entry, the existing entry stays. Entries from deleted profiles are retained as-is.

---

## Game Screen Layout

```
┌─────────────────────────────────┐
│  SCORE    COMBO    LIVES   BEST │  ← HUD
│  RIVER SPEED ████░░░░░░░       │  ← speed bar (cyan→orange→red)
├─────────────────────────────────┤
│         [ NEST ★ ]             │  ← far bank
│  ≈≈ [dal] ≈≈≈ [jas] ≈≈≈       │  ← lane 4 →
│  ≈≈≈ [🐥 sla] ≈≈ [kas*] ≈≈≈  │  ← lane 3 ← (chick on sla, kas* glowing)
│  ≈≈ [kaal] ≈≈≈ [dak] ≈≈       │  ← lane 2 →
│  ≈≈ [laad] ≈≈ [saai] ≈≈≈     │  ← lane 1 ←
│           [ START ]             │  ← near bank
├─────────────────────────────────┤
│  TYPE THE GLOWING PAD           │
│  [s] [l▌] [a]  → hop!          │  ← letter tiles (current word)
│  NEXT: k a a l                 │  ← next pad preview
└─────────────────────────────────┘
```

River uses the project-wide scanline overlay (repeating-linear-gradient pattern from `app.css`).

---

## Pixel Chick

Chunky front-facing design, 9×12 pixel grid at 8px per pixel (72×96px displayed size).

Animation states (CSS keyframe animations on the pixel grid):

| State | Trigger | Animation |
|-------|---------|-----------|
| `idle` | on safe bank or riding pad | gentle bob up 2px and back, loop |
| `hop` | correct word completed | quick arc jump (translate up then to target) |
| `splash` | life lost | fall + bounce + float sideways back to bank |
| `wobble` | wrong keypress | rotate left-right ±15°, 2 cycles, then idle |

---

## Out of Scope (v1)

- Sound effects (no audio in the current app)
- Online / cross-device leaderboard
- Difficulty selector (speed progression handles this naturally)
- Pause / resume mid-game
- Mobile / touch input (physical keyboard only, consistent with the rest of the app)
