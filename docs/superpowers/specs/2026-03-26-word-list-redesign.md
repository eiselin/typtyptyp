# Word List Redesign — Design Spec

**Date:** 2026-03-26

---

## Problem

The current `src/words/nl.json` is a 15,000-entry OpenTaal dictionary dump containing abbreviations, proper names, foreign loanwords, and obscure inflected forms. `src/words/index.js` compensates with complex filters (Dutch digraph pattern, vowel requirement, length ≥ 4) that still produce low-quality, non-representative, and occasionally inappropriate words.

The result: words in exercises feel random and unnatural rather than pedagogically useful.

---

## Goal

Replace the word list with a curated set of child-appropriate Dutch words, organized by safe topic categories, and simplify the filtering logic to a single check: "does this word only use keys the learner has unlocked?"

A blocklist approach was considered and rejected: it is inherently incomplete (one missed word breaks parent trust). A topic whitelist is safe by construction — only explicitly approved words can appear.

---

## Architecture

### Data source

**`scripts/wordlist-topics.json`** — A hand-curated JSON file committed to the repo, organized by child-appropriate topic. Each topic is an array of Dutch words. This file is the source of truth; it can be reviewed, edited, and extended by the team without touching application code.

Topics covered:
- `basiswoorden` — common function words (de, het, een, voor, naast, etc.) and number words (een–tien, twintig, honderd, etc.)
- `dieren` — animals
- `familie` — family members
- `eten` — food and drink
- `kleuren` — colours
- `school` — school objects and activities
- `natuur` — nature
- `weer` — weather
- `huis` — house and home
- `sport` — sports and playground
- `lichaam` — safe body parts
- `vervoer` — transport
- `tijd` — time (days, months, seasons)
- `kleding` — clothing
- `muziek` — music
- `beroepen` — professions (child-familiar)
- `speelgoed` — toys

All words in the file must satisfy:
- Only `a–z` characters (no accents, hyphens, apostrophes, digits)
- Length 3–10 characters
- Genuinely child-appropriate and commonly known by Dutch children

### Processing (one-off script)

A Node.js script (`scripts/build-wordlist.js`) runs once, produces `src/words/nl.json`, and is committed. The script is kept in the repo for transparency and reproducibility.

Processing steps:
1. Read `scripts/wordlist-topics.json`
2. Flatten all topics into a single array, deduplicate
3. Validate: every word must match `/^[a-z]{3,10}$/` — fail loudly if not
4. Write as JSON array to `src/words/nl.json`

The script is not part of the build pipeline. Run manually with `node scripts/build-wordlist.js` if the word list needs regeneration.

### `src/words/index.js` — simplified

Remove: `DUTCH_PATTERN`, `VOWELS`, `POOL_THRESHOLD` (40 → 10).

New `getWordPool`:
```js
export function getWordPool(learnedKeys) {
  const keySet = new Set(learnedKeys.map(k => k.toLowerCase()))
  return wordList.filter(word => [...word].every(c => keySet.has(c)))
}
```

`generateNonsense` and `buildExerciseSequence` remain structurally unchanged. The pool threshold for switching from nonsense to words drops from 40 to 10, since all words in the list are genuinely useful.

---

## Files Changed

| File | Action |
|------|--------|
| `scripts/wordlist-topics.json` | Create — curated words by topic (source of truth) |
| `scripts/build-wordlist.js` | Create — flattens topics → `src/words/nl.json` |
| `src/words/nl.json` | Replace — flattened, deduplicated curated word list |
| `src/words/index.js` | Simplify — remove complex filters |

---

## What Does NOT Change

- `generateNonsense()` — early lessons still get nonsense syllables
- `buildExerciseSequence()` — same structure (new-key emphasis + random pool)
- All screens, stores, lesson definitions — no changes

---

## Testing

- Run `node scripts/build-wordlist.js` and verify `src/words/nl.json` is ~1,500 words
- Manually spot-check: no proper nouns, no abbreviations, no inappropriate words
- Open the app, play through lesson 5 (full home row) — verify exercises show real Dutch words
- Play through lesson 1 (f, j only) — verify nonsense fallback is used
- Run existing test suite: `npm test`
