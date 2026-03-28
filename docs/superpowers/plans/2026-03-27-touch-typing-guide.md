# Touch Typing Guide Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Guide screen reachable from the lesson select screen that teaches touch typing fundamentals (home row, finger zones, eyes on screen, start slow).

**Architecture:** A new `GuideScreen.svelte` is wired into `App.svelte` alongside the four existing screens. A full-width cyan button above the first lesson group in `LessonSelectScreen` navigates to it. All text is i18n-translated. The guide is a single scrollable page — no new stores or components needed.

**Tech Stack:** Svelte 4 (legacy syntax: `on:click`, `$:` — match LessonSelectScreen style), Svelte stores for navigation, Vitest + jsdom for tests.

---

## File Map

| File | Change |
|------|--------|
| `src/i18n/nl.json` | Add 11 new translation keys |
| `src/i18n/en.json` | Add 11 new translation keys |
| `src/screens/GuideScreen.svelte` | Create new screen |
| `src/App.svelte` | Import GuideScreen, add `{:else if $screen === 'guide'}` branch |
| `src/screens/LessonSelectScreen.svelte` | Add guide button above first lesson group |
| `tests/i18n/i18n.test.js` | Add test: guide keys exist in both languages |

---

### Task 1: Add i18n translation keys

**Files:**
- Modify: `src/i18n/nl.json`
- Modify: `src/i18n/en.json`
- Modify: `tests/i18n/i18n.test.js`

- [ ] **Step 1: Add failing tests for new keys**

Inside the existing `describe('i18n', () => { ... })` block in `tests/i18n/i18n.test.js`, add these two `it` blocks at the end (before the closing `})`):

```js
  it('guide keys exist in Dutch', () => {
    setLanguage('nl')
    const translate = get(t)
    expect(translate('lessons.guide')).not.toBe('lessons.guide')
    expect(translate('guide.homeRow.title')).not.toBe('guide.homeRow.title')
    expect(translate('guide.zones.title')).not.toBe('guide.zones.title')
    expect(translate('guide.eyes.title')).not.toBe('guide.eyes.title')
    expect(translate('guide.slow.title')).not.toBe('guide.slow.title')
  })

  it('guide keys exist in English', () => {
    setLanguage('en')
    const translate = get(t)
    expect(translate('lessons.guide')).not.toBe('lessons.guide')
    expect(translate('guide.homeRow.title')).not.toBe('guide.homeRow.title')
    expect(translate('guide.zones.title')).not.toBe('guide.zones.title')
    expect(translate('guide.eyes.title')).not.toBe('guide.eyes.title')
    expect(translate('guide.slow.title')).not.toBe('guide.slow.title')
    setLanguage('nl') // reset to default
  })
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/i18n/i18n.test.js
```
Expected: 2 new tests FAIL — keys not found yet.

- [ ] **Step 3: Add Dutch keys to `src/i18n/nl.json`**

The current last line is `"lessons.label.volledig": "VOLLEDIG"` with no trailing comma. First add a comma to that line, then add the new keys before the closing `}`:

```json
  "lessons.label.volledig": "VOLLEDIG",
  "lessons.guide":         "HOE BLIND TYPEN",
  "lessons.guideAction":   "GIDS →",
  "guide.title":           "GIDS",
  "guide.homeRow.title":   "THUISRIJ",
  "guide.homeRow.body":    "Leg je vingers hier neer voor je begint. Voel de kleine bubbeltjes op F en J — die helpen je de juiste plek te vinden zonder te kijken. Keer na elk woord terug.",
  "guide.zones.title":     "VINGERZONES",
  "guide.zones.body":      "Elke toets heeft één vinger die hem bedient — aangegeven door kleur. Je wijsvingers zijn het drukst bezig: elk dekt twee kolommen. Strek nooit één vinger naar een toets die een andere vinger toebehoort.",
  "guide.eyes.title":      "KIJK OP HET SCHERM",
  "guide.eyes.body":       "Kijk naar de letters op het scherm — niet naar je handen. Het voelt eerst vreemd, maar dit is wat blind typen mogelijk maakt. De app laat zien welke vinger je moet gebruiken als je vastzit.",
  "guide.slow.title":      "BEGIN LANGZAAM",
  "guide.slow.body":       "Typ langzaam en nauwkeurig. Snelheid komt vanzelf — fouten maken je alleen maar langzamer. Drie sterren betekent 95% nauwkeurigheid, niet de snelste tijd."
```

- [ ] **Step 4: Add English keys to `src/i18n/en.json`**

Same as above — the current last line is `"lessons.label.volledig": "FULL"` with no trailing comma. Add the comma first, then the new keys before `}`:

```json
  "lessons.label.volledig": "FULL",
  "lessons.guide":         "HOW TO TOUCH TYPE",
  "lessons.guideAction":   "GUIDE →",
  "guide.title":           "GUIDE",
  "guide.homeRow.title":   "HOME ROW",
  "guide.homeRow.body":    "Place your fingers here before you start. Feel the small bumps on F and J — those help you find the right spot without looking. After every word, come back here.",
  "guide.zones.title":     "FINGER ZONES",
  "guide.zones.body":      "Every key has one finger responsible for it — shown by color. Your index fingers are the busiest, each covering two columns. Never stretch one finger to reach a key that belongs to another.",
  "guide.eyes.title":      "EYES ON SCREEN",
  "guide.eyes.body":       "Look at the letters on screen — not your hands. It feels strange at first, but this is what makes touch typing work. The app shows you which finger to use if you get stuck.",
  "guide.slow.title":      "START SLOW",
  "guide.slow.body":       "Type slowly and correctly. Speed builds on its own — mistakes just slow you down in the long run. Three stars means 95% accuracy, not fastest time."
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/i18n/i18n.test.js
```
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/nl.json src/i18n/en.json tests/i18n/i18n.test.js
git commit -m "feat: add guide screen i18n translation keys"
```

---

### Task 2: Create GuideScreen.svelte

**Files:**
- Create: `src/screens/GuideScreen.svelte`

The screen has no reactive state — it is entirely presentational. It uses:
- `FINGER_MAP` from `src/lessons/index.js` to map each key to its finger id (e.g. `'a' → 'lp'`)
- CSS variable `--f-{fingerId}` (e.g. `--f-lp`) for finger colors — these are already defined globally
- `finger.*` i18n keys for the label under each home row key
- `hand.left` / `hand.right` i18n keys (already in both JSON files)
- `keyboard.space` i18n key (already in both JSON files) for the spacebar label

- [ ] **Step 1: Create `src/screens/GuideScreen.svelte`**

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { goTo } from '../stores/screen.js'
  import { FINGER_MAP } from '../lessons/index.js'

  // Home row keys with metadata. null = visual gap between hands.
  const HOME_ROW = [
    { key: 'a', finger: 'lp' },
    { key: 's', finger: 'lr' },
    { key: 'd', finger: 'lm' },
    { key: 'f', finger: 'li', bump: true },
    { key: 'g', finger: 'li', dim: true },
    null,
    { key: 'h', finger: 'ri', dim: true },
    { key: 'j', finger: 'ri', bump: true },
    { key: 'k', finger: 'rm' },
    { key: 'l', finger: 'rr' },
    { key: ';', finger: 'rp' },
  ]

  const ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.','/'],
  ]
</script>

<div class="screen guide">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
    <span class="title">{$t('guide.title')}</span>
  </div>

  <div class="inner">

    <!-- Section 1: Home Row -->
    <div class="section-title">{$t('guide.homeRow.title')}</div>
    <div class="home-row-block">
      <div class="home-row-keys">
        {#each HOME_ROW as item}
          {#if item === null}
            <span class="gap">·</span>
          {:else}
            <div class="key" class:bump={item.bump} class:dim={item.dim}
              style="--kc: var(--f-{item.finger})">
              <div class="key-char">{item.key.toUpperCase()}</div>
              <div class="key-finger">{$t(`finger.${item.finger}`)}</div>
            </div>
          {/if}
        {/each}
      </div>
      <div class="hand-labels">
        <span>{$t('hand.left')}</span>
        <span>{$t('hand.right')}</span>
      </div>
    </div>
    <p class="body-text">{$t('guide.homeRow.body')}</p>

    <div class="divider"></div>

    <!-- Section 2: Finger Zones -->
    <div class="section-title">{$t('guide.zones.title')}</div>
    <div class="kbd-block">
      {#each ROWS as row}
        <div class="kbd-row">
          {#each row as key}
            {@const finger = FINGER_MAP[key]}
            <div class="kbd-key" style="--kc: var(--f-{finger})">{key.toUpperCase()}</div>
          {/each}
        </div>
      {/each}
      <div class="kbd-space">{$t('keyboard.space')}</div>
    </div>
    <p class="body-text">{$t('guide.zones.body')}</p>

    <div class="divider"></div>

    <!-- Section 3: Eyes on Screen -->
    <div class="section-title">{$t('guide.eyes.title')}</div>
    <p class="body-text">{$t('guide.eyes.body')}</p>

    <div class="divider"></div>

    <!-- Section 4: Start Slow -->
    <div class="section-title">{$t('guide.slow.title')}</div>
    <p class="body-text">{$t('guide.slow.body')}</p>

  </div>
</div>

<style>
  .screen.guide { max-width: 520px; margin: 0 auto; }

  .topbar { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px 0; }
  .back-btn { font-family: inherit; font-size: 12px; color: var(--text); background: none; border: none; cursor: pointer; letter-spacing: 1px; }
  .title { font-size: 13px; color: var(--text); letter-spacing: 2px; }

  .inner { padding: 14px 18px 32px; }
  .section-title { font-size: 11px; color: var(--accent-cyan); letter-spacing: 3px; font-weight: bold; margin-bottom: 12px; margin-top: 4px; text-shadow: 0 0 10px color-mix(in srgb, var(--accent-cyan) 40%, transparent); }
  .body-text { font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px; line-height: 1.8; margin-top: 10px; }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── Home row ── */
  .home-row-block { background: var(--bg-sunken); border-radius: 6px; padding: 12px 10px 8px; }
  .home-row-keys { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-bottom: 8px; }
  .gap { color: var(--border); align-self: flex-start; padding: 8px 2px 0; font-size: 14px; }
  .key { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .key-char {
    padding: 5px 7px; border-radius: 4px; font-size: 13px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    min-width: 26px; text-align: center; font-family: 'Courier New', monospace;
  }
  .key.bump .key-char { border-bottom-width: 3px; }
  .key.dim { opacity: 0.3; }
  .key-finger { font-size: 8px; color: var(--kc); letter-spacing: 0.5px; opacity: 0.8; text-align: center; max-width: 38px; line-height: 1.3; }
  .hand-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); letter-spacing: 1px; padding: 0 2px; }

  /* ── Keyboard zones ── */
  .kbd-block { background: var(--bg-sunken); border-radius: 6px; padding: 10px 12px 8px; }
  .kbd-row { display: flex; gap: 3px; justify-content: center; margin-bottom: 3px; }
  .kbd-key {
    padding: 4px 4px; border-radius: 3px; font-size: 10px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    min-width: 22px; text-align: center; font-family: 'Courier New', monospace;
  }
  .kbd-space { text-align: center; font-size: 10px; color: var(--text-muted); letter-spacing: 2px; margin-top: 6px; }
</style>
```

- [ ] **Step 2: Run existing tests to make sure nothing is broken**

```bash
npm test
```
Expected: all existing tests PASS (GuideScreen has no new logic to test at this stage).

- [ ] **Step 3: Commit**

```bash
git add src/screens/GuideScreen.svelte
git commit -m "feat: add GuideScreen with home row, finger zones, eyes, and start slow sections"
```

---

### Task 3: Wire up navigation and entry point

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/screens/LessonSelectScreen.svelte`

- [ ] **Step 1: Add GuideScreen to `src/App.svelte`**

Add the import after the existing screen imports (after `import ResultsScreen`):

```js
import GuideScreen        from './screens/GuideScreen.svelte'
```

Add the `{:else if}` branch after the `results` branch (before the closing `{/if}`):

```svelte
    {:else if $screen === 'guide'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <GuideScreen />
      </div>
```

- [ ] **Step 2: Add guide button to `src/screens/LessonSelectScreen.svelte`**

The guide button goes inside `.inner`, just before the first `{#each GROUPS as group}` loop. Add it as a single full-width element using `grid-column: 1 / -1` isn't needed here because the button sits outside the `.grid` — it just needs to be a block element above the first group label.

In `LessonSelectScreen.svelte`, add the import for `goTo` — it's already imported (`import { goTo, selectLesson } from '../stores/screen.js'`), so nothing extra needed.

Find this block in the template:

```svelte
  <div class="inner">
    {#each GROUPS as group}
```

Replace with:

```svelte
  <div class="inner">
    <button class="guide-btn" on:click={() => goTo('guide')}>
      <span class="guide-btn-title">{$t('lessons.guide')}</span>
      <span class="guide-btn-action">{$t('lessons.guideAction')}</span>
    </button>
    {#each GROUPS as group}
```

Add these CSS rules to the `<style>` block in `LessonSelectScreen.svelte`:

```css
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
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all tests PASS.

- [ ] **Step 4: Manually verify in the browser**

```bash
npm run dev
```

Check:
1. Lesson select screen shows the guide button above the first group
2. Clicking navigates to the guide screen with wipe transition
3. Guide screen shows all 4 sections with color-coded keys
4. Back button returns to lesson select with wipe transition
5. Works in both Dutch and English (switch language on home screen and re-check)
6. F and J keys have a thicker bottom border (bump indicator)
7. G and H are visibly dimmed

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte src/screens/LessonSelectScreen.svelte
git commit -m "feat: wire up guide screen navigation and lesson select entry point"
```
