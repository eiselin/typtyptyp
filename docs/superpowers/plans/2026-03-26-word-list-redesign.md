# Word List Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 15,000-word OpenTaal dictionary dump with a hand-curated, topic-whitelisted set of child-appropriate Dutch words, and simplify the word-pool filtering logic to a single key-availability check.

**Architecture:** A committed `scripts/wordlist-topics.json` organizes words by safe topic (animals, food, family, etc.) — safe by construction, no blocklist needed. A one-off Node script (`scripts/build-wordlist.js`) flattens it to `src/words/nl.json`. Then `src/words/index.js` drops the Dutch digraph/vowel/length filters — the word list is already curated, so only "does this word use available keys?" remains. A pre-existing failing lesson-count test is fixed as a housekeeping step.

**Tech Stack:** Node.js (ESM), Vitest for tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/wordlist-topics.json` | **Create** | Curated words organized by child-safe topic (source of truth) |
| `scripts/build-wordlist.js` | **Create** | Flatten topics → validate → write `src/words/nl.json` |
| `src/words/nl.json` | **Replace** | ~1,500 curated high-frequency Dutch words |
| `src/words/index.js` | **Simplify** | Drop digraph/vowel/length filters; lower threshold to 10 |
| `tests/words/words.test.js` | **Keep** | All existing tests must pass unchanged |
| `tests/lessons/lessons.test.js` | **Fix** | Update lesson count assertion from 20 → 15 |

---

### Task 1: Fix the pre-existing failing lesson-count test

There is already a test failure unrelated to this feature: `LESSONS > has 20 lessons` fails because number-key lessons were previously removed, leaving 15 lessons. Fix it now so we have a clean baseline.

**Files:**
- Modify: `tests/lessons/lessons.test.js:5`

- [ ] **Step 1: Run tests to confirm the pre-existing failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A5 "FAIL\|failed"
```

Expected: `AssertionError: expected [ …(15) ] to have a length of 20 but got 15`

- [ ] **Step 2: Fix the assertion**

In `tests/lessons/lessons.test.js`, change line 5:

```js
// Before:
expect(LESSONS).toHaveLength(20)

// After:
expect(LESSONS).toHaveLength(15)
```

- [ ] **Step 3: Run tests to verify all pass**

```bash
npm test
```

Expected: `5 passed`, no failures.

- [ ] **Step 4: Commit**

```bash
git add tests/lessons/lessons.test.js
git commit -m "fix: update lesson count test to match current 15 lessons"
```

---

### Task 2: Create `scripts/wordlist-topics.json` and `scripts/build-wordlist.js`

**Files:**
- Create: `scripts/wordlist-topics.json`
- Create: `scripts/build-wordlist.js`

No unit test for this script — it's a one-off data pipeline. Verification is done by running it and inspecting the output in Task 3.

- [ ] **Step 1: Verify `scripts/wordlist-topics.json` exists**

The file is pre-generated as part of this plan. Run the validator to confirm it's clean:

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('scripts/wordlist-topics.json','utf8'));
let errors = 0;
for (const [topic, words] of Object.entries(data)) {
  for (const w of words) {
    if (!/^[a-z]{2,10}$/.test(w)) { console.error(topic, w); errors++; }
  }
}
console.log(errors ? errors + ' errors' : 'All words valid');
"
```

Expected: `All words valid`

- [ ] **Step 2: Create `scripts/build-wordlist.js`**

Create `scripts/build-wordlist.js` with this exact content:

```js
#!/usr/bin/env node
/**
 * One-off script: flattens scripts/wordlist-topics.json into src/words/nl.json.
 * All words in the topics file are hand-curated and child-appropriate.
 * Run: node scripts/build-wordlist.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const INPUT  = resolve(__dir, 'wordlist-topics.json')
const OUTPUT = resolve(__dir, '../src/words/nl.json')

const topics = JSON.parse(readFileSync(INPUT, 'utf8'))

const seen  = new Set()
const words = []
const errors = []

for (const [topic, list] of Object.entries(topics)) {
  for (const word of list) {
    if (!/^[a-z]{2,10}$/.test(word)) {
      errors.push(`[${topic}] "${word}" fails validation (must be a–z, length 2–10)`)
      continue
    }
    if (seen.has(word)) continue
    seen.add(word)
    words.push(word)
  }
}

if (errors.length > 0) {
  console.error('Validation errors:')
  errors.forEach(e => console.error(' ', e))
  process.exit(1)
}

writeFileSync(OUTPUT, JSON.stringify(words))
console.log(`Wrote ${words.length} words to ${OUTPUT}`)
```

- [ ] **Step 3: Commit both files**

```bash
git add scripts/wordlist-topics.json scripts/build-wordlist.js
git commit -m "feat: add curated topic-whitelist word list and build script"
```

---

### Task 3: Run the script and replace `src/words/nl.json`

**Files:**
- Replace: `src/words/nl.json`

- [ ] **Step 1: Run the script**

```bash
node scripts/build-wordlist.js
```

Expected output (approximate):
```
Fetching https://raw.githubusercontent.com/...
Wrote 1500 words to .../src/words/nl.json
First 10: van, een, het, dat, voor, met, die, niet, aan, ook
Last 10:  [some common Dutch words]
```

- [ ] **Step 2: Verify word count**

```bash
node -e "const w = require('./src/words/nl.json'); console.log('words:', w.length)"
```

Expected: `words: 1500`

- [ ] **Step 3: Spot-check for quality**

```bash
node -e "
const w = require('./src/words/nl.json');
console.log('Total:', w.length);
console.log('Short (3):', w.filter(x => x.length === 3).slice(0,10));
console.log('Medium (5):', w.filter(x => x.length === 5).slice(0,10));
console.log('Long (8+):', w.filter(x => x.length >= 8).slice(0,10));
"
```

Verify manually: no abbreviations, no proper nouns (no capitalised words since we lowercased), no English words, no inappropriate words.

- [ ] **Step 4: Commit the new word list**

```bash
git add src/words/nl.json
git commit -m "feat: replace word list with 1500 high-frequency family-friendly Dutch words"
```

---

### Task 4: Simplify `src/words/index.js`

Drop `DUTCH_PATTERN`, `VOWELS`, and the digraph/vowel/length filters from `getWordPool`. Lower `POOL_THRESHOLD` from 40 to 10.

**Files:**
- Modify: `src/words/index.js`
- Test: `tests/words/words.test.js` (existing tests must pass unchanged)

- [ ] **Step 1: Run existing word tests to confirm they currently pass**

```bash
npm test -- tests/words/words.test.js --reporter=verbose
```

Expected: all 6 tests pass.

- [ ] **Step 2: Rewrite `src/words/index.js`**

Replace the entire file with:

```js
import wordList from './nl.json'

const POOL_THRESHOLD = 10

export function getWordPool(learnedKeys) {
  const keySet = new Set(learnedKeys.map(k => k.toLowerCase()))
  return wordList.filter(word => [...word].every(c => keySet.has(c)))
}

export function hasEnoughWords(learnedKeys) {
  return getWordPool(learnedKeys).length >= POOL_THRESHOLD
}

const PATTERNS = [
  (a, b) => [a,a,b,b],
  (a, b) => [a,b,a,b],
  (a, b) => [b,b,a,a],
  (a, b) => [b,a,b,a],
  (a, b) => [a,b,b,a],
  (a, b) => [b,a,a,b],
  (a, b) => [a,a,b,b,a],
  (a, b) => [a,b,a,b,b],
]

export function generateNonsense(keySet, count) {
  const keys = [...keySet]
  return Array.from({ length: count }, (_, i) => {
    const a = keys[i % keys.length]
    const b = keys[(i + 1) % keys.length] ?? a
    return PATTERNS[i % PATTERNS.length](a, b).join('')
  })
}

export function buildExerciseSequence(learnedKeys, newKeys = [], targetLength = 200) {
  const pool = getWordPool(learnedKeys)
  const useWords = pool.length >= POOL_THRESHOLD

  let allWords, newKeyWords

  if (useWords) {
    allWords = pool
    const newKeySet = new Set(newKeys.map(k => k.toLowerCase()).filter(k => k !== ' '))
    newKeyWords = newKeySet.size > 0
      ? pool.filter(w => [...w].some(c => newKeySet.has(c)))
      : []
  } else {
    allWords = generateNonsense(learnedKeys, 40)
    const newKeySet = new Set(newKeys.map(k => k.toLowerCase()).filter(k => k !== ' '))
    newKeyWords = newKeySet.size > 0
      ? generateNonsense([...newKeySet, ...learnedKeys.filter(k => !newKeySet.has(k))].slice(0, 6), 20)
      : []
  }

  const result = []
  let len = 0
  let newKeyWordCount = 0
  const targetNewKeyRatio = newKeyWords.length > 0 ? 0.5 : 0

  while (len < targetLength) {
    const currentRatio = result.length > 0 ? newKeyWordCount / result.length : 0
    const useNewKeyWord = newKeyWords.length > 0 && currentRatio < targetNewKeyRatio

    const source = useNewKeyWord ? newKeyWords : allWords
    const word = source[Math.floor(Math.random() * source.length)]
    result.push(word)
    if (useNewKeyWord) newKeyWordCount++
    len += word.length + 1
  }

  return result.join(' ').slice(0, targetLength).trimEnd()
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all 5 test files pass, no failures.

- [ ] **Step 4: Manual smoke test in the browser**

```bash
npm run dev
```

Open the app, navigate to lesson 5 (full home row: ASDFGHJKL;). Start the exercise. Verify:
- Exercise shows real Dutch words (not nonsense syllables)
- Words look natural and age-appropriate (geen, land, slag, dag, etc.)

Navigate to lesson 1 (F J only). Start the exercise. Verify:
- Exercise shows nonsense character strings (fjfj, jfjf, etc.)

- [ ] **Step 5: Commit**

```bash
git add src/words/index.js
git commit -m "refactor: simplify word pool filtering — drop digraph/vowel/length filters"
```

---

## Done

After all tasks:
- `npm test` passes with no failures
- `src/words/nl.json` contains ~1,500 high-frequency Dutch words
- `src/words/index.js` is ~50 lines with no complex filter logic
- Early lessons still use nonsense syllables; later lessons use real common Dutch words
