# typtyptyp

A gamified touch-typing trainer for kids. Learn to type blind, one row of keys at a time.

Live at **[typtyptyp.nl](https://typtyptyp.nl)**

Designed by Nick Eiselin.

---

## Concept

Most typing tutors treat learning as a chore — grey screens, metrics, no character. typtyptyp treats it as a small game. A pixel chick bounces happily when you hit the right key. It shakes when you don't. You earn stars. You unlock the next lesson.

The pedagogy is straightforward: introduce a few keys at a time, build up your key set gradually, and always practice with real Dutch words as soon as the learned key set makes that possible. Early lessons use synthetic patterns (like `fjfj` and `ffjj`) because there simply aren't enough words yet. Once you know enough letters to form real words, the trainer switches automatically.

New keys always get extra emphasis — about half the words in a new lesson will contain the newly introduced keys. A brief intro screen shows you where your fingers go before you start typing.

Progress is tracked per profile. Stars and personal bests are kept across sessions. The trainer always records your best result, so retrying a lesson can only help you.

---

## How It Works

### Lesson structure

15 lessons arranged into four groups:

| Group | Keys |
|---|---|
| Thuisrij (home row) | F J → D K → S L → A → full home row |
| Bovenrij (top row) | R U → E I → W O → Q P → full top row |
| Onderrij (bottom row) | V M → C → X → Z |
| Volledig | All keys at once |

Each lesson is locked until you earn at least one star on the previous one. There are no time limits on individual attempts. Completing all lessons in a group unlocks that group's arcade game.

### Exercise flow

1. **Intro** — if the lesson introduces new keys, a card shows each key with the finger that types it.
2. **Exercise** — a generated sequence of words appears as letter tiles. The active tile glows. Type the sequence; each correct keystroke advances the cursor, each mistake increments the error count. The pixel chick reacts to both.
3. **Results** — accuracy, WPM, and a star rating (1–3) are shown. Results are saved if they beat your previous best.

### Arcade mode

Each group of lessons has an arcade game that unlocks once all lessons in the group are complete. A pixel chick hops across lily pads on a river; each lily pad shows a word. Type the word to cross to it. The chick must reach the far bank — type the nest word to finish the run. Score is based on crossings and speed.

Results are saved to a per-group leaderboard stored locally. A score summary screen shows your score, crossings, previous best, and the full leaderboard.

### Guide

A beginner's guide explains home row positioning, finger zones, keeping eyes on the screen, and starting slow. Each key in the home row is shown with its finger colour and label. The full keyboard is displayed colour-coded by finger.

### Progress & coach

The progress screen shows a keyboard heatmap colour-coded by accuracy (green / orange / red) based on a rolling window of recent keypresses. A professor chick coach provides feedback: which keys you've learned, which need work, and a shortcut to practice the weakest key's lesson.

### Word generation

The exercise sequence is generated fresh each time:

- The word pool is all Dutch words from the word list that can be typed using only the keys learned so far.
- If the pool is large enough (≥ 10 words), real Dutch words are used. Otherwise synthetic letter patterns are generated from the available keys.
- Words are drawn in shuffled cycles so the same word doesn't repeat before the full pool has been seen.
- The sequence continues until it reaches roughly 200 characters, ending cleanly at a word boundary.
- When a lesson introduces new keys, ~50% of words are chosen from the subset that contains those keys.

### Scoring

| Stars | Accuracy |
|---|---|
| ★★★ | ≥ 95% |
| ★★☆ | ≥ 80% |
| ★☆☆ | < 80% |

Accuracy is calculated over non-space characters only. WPM is words ÷ elapsed minutes. Both are stored as lifetime bests — retrying can only improve your score.

### Profiles

Multiple profiles can coexist on the same device. Each profile has a name, a colour, and a full lesson progress record. Profiles can be renamed or deleted. Profiles are stored in `localStorage`; the active profile is remembered in `sessionStorage` across page refreshes. If storage is unavailable (e.g. private browsing) a banner is shown and progress is session-only.

---

## Keyboard Navigation

The app is fully keyboard-navigable:

- **Arrow keys** — navigate between tiles and buttons on all screens. Left/Right move in reading order; Up/Down move between rows using screen position (2D navigation on the lesson select grid).
- **Space / Enter** — activate the focused button.
- **Escape** — go back or dismiss a modal on all screens.

The lesson select screen auto-focuses the next available lesson on load. The home screen auto-focuses the start button.

---

## Tech Stack

| | |
|---|---|
| Framework | [Svelte 5](https://svelte.dev) — runes mode + legacy syntax (both coexist) |
| Build tool | [Vite 6](https://vitejs.dev) |
| Tests | [Vitest](https://vitest.dev) + [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro) |
| Styles | Plain CSS with custom properties, no framework |
| Storage | `localStorage` + `sessionStorage`, no backend |
| Languages | Dutch (NL) and English (EN), switchable at runtime |
| Deployment | GitHub Pages with custom domain |

The app is a fully client-side SPA. All state lives in the browser.

Svelte 5 runes are used in `ExerciseScreen.svelte` and `GameScreen.svelte`. The other screens use Svelte 4 legacy syntax — both coexist fine in Svelte 5.

---

## Project Structure

```
src/
├── App.svelte                    screen router + wipe transitions
├── app.css                       theme variables, global reset, focus styles
├── main.js                       entry point
│
├── screens/
│   ├── HomeScreen.svelte         profile selection & creation
│   ├── LessonSelectScreen.svelte lesson grid with lock/star state + arcade tiles
│   ├── ExerciseScreen.svelte     typing exercise + scale-to-fit logic
│   ├── ResultsScreen.svelte      score display + confetti (practice & arcade)
│   ├── GameScreen.svelte         arcade river-crossing game
│   ├── GuideScreen.svelte        beginner's guide: home row, finger zones
│   └── ProgressScreen.svelte     keyboard heatmap + coach tips
│
├── components/
│   ├── PixelChick.svelte         pixel art mascot (idle / happy / error / wobble)
│   ├── ProfessorChick.svelte     pixel art professor variant (progress coach)
│   ├── Keyboard.svelte           full QWERTY visualisation, colour-coded by finger
│   ├── HandHints.svelte          hand diagram showing which finger types next
│   ├── LetterTiles.svelte        scrolling tile display for the exercise text
│   └── ProfileCard.svelte        profile avatar card with rename/delete
│
├── stores/
│   ├── screen.js                 navigation state
│   ├── profiles.js               profiles, progress, localStorage persistence
│   ├── results.js                current exercise results
│   ├── game.js                   arcade game results
│   └── leaderboard.js            per-group local leaderboard
│
├── utils/
│   └── keyboard.js               arrow key navigation utilities (flat + 2D)
│
├── lessons/
│   └── index.js                  15 lessons + finger-to-key mapping
│
├── words/
│   ├── index.js                  exercise sequence builder
│   └── nl.json                   Dutch word list
│
└── i18n/
    ├── index.js                  reactive translation store
    ├── nl.json                   Dutch UI strings
    └── en.json                   English UI strings
```

---

## Development

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm test         # run test suite
```

Tests cover word generation logic, lesson data, the profile store, and i18n. Visual components are not tested.

---

## Design notes

**Aesthetic** — dark purple background (`#12082a`), neon cyan/green/yellow accents, monospace type throughout. Eight finger colour variables (`--f-lp` through `--f-rp`) run through every visual element: the keyboard, hand hints, guide, and progress heatmap all share the same colour system. Pixel art characters are built from SVG rectangles.

**No emojis** — the pixel art aesthetic requires SVG sprites instead.

**Responsive layout** — the exercise screen scales down proportionally when the viewport is shorter than the natural layout height, so the keyboard is always fully visible without scrolling. Other screens scroll normally.

**No sounds** — feedback is visual only: tile colours, the chick's reaction, the progress bar. This keeps the app usable anywhere without headphones.

**Dutch-first** — the word list is Dutch. The UI is available in Dutch and English, switchable from the home screen.
