# typtyptyp

Touch-typing trainer for kids. 15 lessons, one key group at a time, real Dutch words throughout.

**[typtyptyp.nl](https://typtyptyp.nl)** — designed by Nick Eiselin.

---

## Lessons

15 lessons in four groups:

| Group | Keys |
|---|---|
| Thuisrij (home row) | F J → D K → S L → A → full home row |
| Bovenrij (top row) | R U → E I → W O → Q P → full top row |
| Onderrij (bottom row) | V M → C → X → Z |
| Volledig | All keys at once |

Each lesson unlocks after earning one star on the previous. Completing a group unlocks its arcade game.

**Exercise flow:** intro screen (new keys + finger hints) → typing exercise → results (accuracy, WPM, 1–3 stars). Best results are saved per profile.

**Word generation:** words are drawn from a Dutch word list filtered to the keys learned so far. If fewer than 10 words are available, synthetic patterns are used instead. New-key lessons weight ~50% of words toward those keys. Sequences run to ~200 characters.

**Scoring:** ★★★ ≥ 95% · ★★☆ ≥ 80% · ★☆☆ < 80% accuracy (non-space characters only).

## Arcade

Each group has a river-crossing arcade game. A chick hops across lily pads; each pad shows a word to type. Reach the far bank by typing the nest word. Score is based on crossings and speed. Results go to a per-group local leaderboard.

## Guide & Progress

**Guide** — home row key positions with finger labels, full keyboard colour-coded by finger zone, posture tips.

**Progress** — keyboard heatmap (green/orange/red) based on a rolling accuracy window. A professor chick coach calls out weak keys and links to the relevant lesson.

## Keyboard navigation

Arrow keys navigate all screens (2D on the lesson grid). Space/Enter activate the focused element. Escape goes back or closes modals. The lesson select screen auto-focuses the next available lesson.

---

## Tech

| | |
|---|---|
| Framework | Svelte 5 (runes in ExerciseScreen + GameScreen, legacy elsewhere) |
| Build | Vite 6 |
| Tests | Vitest + @testing-library/svelte |
| Storage | localStorage + sessionStorage, no backend |
| Languages | NL + EN, switchable at runtime |
| Deployment | GitHub Pages |

## Structure

```
src/
├── screens/
│   ├── HomeScreen.svelte         profile select & create
│   ├── LessonSelectScreen.svelte lesson grid + arcade tiles
│   ├── ExerciseScreen.svelte     typing exercise
│   ├── ResultsScreen.svelte      results + confetti
│   ├── GameScreen.svelte         arcade river game
│   ├── GuideScreen.svelte        beginner's guide
│   └── ProgressScreen.svelte     heatmap + coach
├── components/
│   ├── PixelChick.svelte         mascot (idle/happy/error/wobble)
│   ├── ProfessorChick.svelte     professor variant
│   ├── Keyboard.svelte           QWERTY, finger-coloured
│   ├── HandHints.svelte          next-finger diagram
│   ├── LetterTiles.svelte        exercise text display
│   └── ProfileCard.svelte        profile card (rename/delete)
├── stores/
│   ├── screen.js                 navigation
│   ├── profiles.js               profiles + progress (localStorage)
│   ├── results.js                exercise results
│   ├── game.js                   arcade results
│   └── leaderboard.js            local leaderboard
├── utils/keyboard.js             arrow key nav (flat + 2D)
├── lessons/index.js              15 lessons + finger map
├── words/                        sequence builder + nl.json word list
└── i18n/                         nl.json + en.json
```

## Development

```bash
npm install
npm run dev      # localhost:5173
npm run build    # → dist/
npm test
```

## Design

- Dark purple (`#12082a`), neon accents, monospace throughout
- Eight finger colour variables (`--f-lp` → `--f-rp`) shared across keyboard, hints, guide, and heatmap
- Pixel art characters built from SVG rectangles; no emojis
- Exercise screen scales to fit viewport height; other screens scroll
- No audio — visual feedback only
