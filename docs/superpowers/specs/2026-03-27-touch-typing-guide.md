# Touch Typing Guide Screen — Design Spec

## Goal

Add a dedicated Guide screen that teaches kids and parents the fundamentals of touch typing, accessible directly from the lesson selection screen.

## Entry Point

A full-width button sits above the first lesson group in `LessonSelectScreen`, spanning all three grid columns. It uses the same cyan accent as available lesson cards so it reads as an action.

```
┌─────────────────────────────────────┐
│ HOW TO TOUCH TYPE                   │
│ GUIDE →                             │
└─────────────────────────────────────┘
[ F J ] [ D K ] [ S L ]   ← first lesson group starts here
```

- Title line: `HOW TO TOUCH TYPE` (translated)
- Subtitle line: `GUIDE →` (translated)
- `white-space: nowrap` to prevent wrapping on narrow screens
- Styled: `border: 2px solid var(--accent-cyan)`, subtle cyan glow, `background: var(--bg-raised)`
- Clicking navigates to the `'guide'` screen

## Navigation

- `src/stores/screen.js` requires **no changes** — `goTo` accepts any string, `goTo('guide')` works as-is
- `goTo('guide')` called from the guide button in LessonSelectScreen
- GuideScreen has a back button (`goTo('lessons')`) in its topbar, matching the pattern of other screens

## GuideScreen Layout

Single scrollable page. Same topbar pattern as LessonSelectScreen: back button left, `GUIDE` title center (or right-aligned label). Four sections separated by dividers.

### Section 1 — Home Row

A color-coded key display showing `A S D F G · H J K L ;` with:
- Each key colored using the app's existing finger color CSS variables (`--f-lp`, `--f-lr`, `--f-lm`, `--f-li`, `--f-ri`, `--f-rm`, `--f-rr`, `--f-rp`)
- Finger role label beneath each key — reuses the existing `finger.*` i18n keys (`finger.lp`, `finger.lr`, `finger.lm`, `finger.li`, `finger.ri`, `finger.rm`, `finger.rr`, `finger.rp`), which already exist in both `nl.json` and `en.json`
- `LEFT HAND` and `RIGHT HAND` labels
- G and H shown at reduced opacity (same index finger, but not home position keys)
- F and J visually distinguished with a bottom-border underline to represent the physical bump

Body text: "Place your fingers here before you start. Feel the small bumps on F and J — those help you find the right spot without looking. After every word, come back here."

### Section 2 — Finger Zones

A three-row color-coded keyboard (Q–P / A–; / Z–/) using the same finger color variables. Each key is a small colored rectangle. Spacebar shown below as "SPACE — both thumbs".

Body text: "Every key has one finger responsible for it — shown by color. Your index fingers are the busiest, each covering two columns. Never stretch one finger to reach a key that belongs to another."

### Section 3 — Eyes on Screen

Body text: "Look at the letters on screen — not your hands. It feels strange at first, but this is what makes touch typing work. The app shows you which finger to use if you get stuck."

### Section 4 — Start Slow

Body text: "Type slowly and correctly. Speed builds on its own — mistakes just slow you down in the long run. Three stars means 95% accuracy, not fastest time."

## i18n

All section titles and body text added as translation keys to `nl.json` and `en.json`. New keys:

```
guide.title
guide.homeRow.title
guide.homeRow.body
guide.zones.title
guide.zones.body
guide.eyes.title
guide.eyes.body
guide.slow.title
guide.slow.body
lessons.guide          ← button title: "HOW TO TOUCH TYPE"
lessons.guideAction    ← button subtitle: "GUIDE →"
```

The spacebar label in the finger zones keyboard diagram reuses the existing `keyboard.space` key rather than introducing a new one.

## Files Changed

- **Create**: `src/screens/GuideScreen.svelte`
- **Modify**: `src/App.svelte` — add `import GuideScreen from './screens/GuideScreen.svelte'` to the script block, and add a `{:else if $screen === 'guide'}` branch with `<div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>` wrapper, matching every other screen's transition pattern exactly
- **Modify**: `src/screens/LessonSelectScreen.svelte` — add guide button above first lesson group
- **Modify**: `src/i18n/nl.json` — add guide translation keys
- **Modify**: `src/i18n/en.json` — add guide translation keys

## Style Notes

- GuideScreen uses no new CSS variables — only existing theme vars and finger color vars
- Key blocks in home row and finger zones are inline HTML, not the Keyboard component (which is interaction-focused and sized for the exercise screen)
- Max-width matches LessonSelectScreen (`520px`)
