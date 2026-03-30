# Zinnen Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `zinnen` lesson group (lessons 14–18) teaching Shift, capitals, and punctuation via pre-written Chick adventure sentences in Dutch and English.

**Architecture:** Sentences are stored in `src/lessons/zinnen/{nl,en}.json`, keyed by lesson id. `ExerciseScreen` branches on `lesson.group === 'zinnen'` to call a new `buildSentenceSequence` helper instead of the word generator. Shift highlighting is driven by three new helpers (`needsShift`, `getPhysicalKey`, `getShiftSide`) exported from `src/lessons/index.js` and consumed by `Keyboard` and `HandHints`.

**Tech Stack:** Svelte (runes in ExerciseScreen, options API in LessonSelectScreen), Vitest, vanilla JS

---

## File Map

| File | Change |
|------|--------|
| `src/lessons/index.js` | Add FINGER_MAP entries, `needsShift`, `getPhysicalKey`, `getShiftSide`, 5 new LESSONS |
| `src/lessons/zinnen/nl.json` | New — Dutch sentences for lessons 14–18 |
| `src/lessons/zinnen/en.json` | New — English sentences for lessons 14–18 |
| `src/words/index.js` | Add `buildSentenceSequence`, `SENTENCE_LISTS` |
| `src/i18n/en.json` | Add `lessons.group.zinnen` |
| `src/i18n/nl.json` | Add `lessons.group.zinnen` |
| `src/screens/LessonSelectScreen.svelte` | Add zinnen group, hide game tile for zinnen |
| `src/screens/ExerciseScreen.svelte` | Branch on zinnen for sequence + intro cards |
| `src/components/Keyboard.svelte` | Add Shift keys, physical key mapping |
| `src/components/HandHints.svelte` | Dual-finger highlighting for Shift |
| `tests/lessons/lessons.test.js` | Update count, add new helper tests |
| `tests/words/words.test.js` | Add buildSentenceSequence tests |
| `tests/lessons/zinnen.test.js` | New — sentence file coverage tests |

---

## Task 1: Data foundation — FINGER_MAP, helpers, lesson entries

**Files:**
- Modify: `src/lessons/index.js`
- Modify: `tests/lessons/lessons.test.js`

- [ ] **Step 1: Write failing tests**

Add to `tests/lessons/lessons.test.js`:

```js
import { LESSONS, FINGER_MAP, getLearnedKeys, getFingerForKey, getRecommendedLesson, needsShift, getPhysicalKey, getShiftSide } from '../../src/lessons/index.js'

describe('LESSONS', () => {
  it('has 18 lessons', () => {
    expect(LESSONS).toHaveLength(18)
  })
  // ... existing tests unchanged
})

describe('FINGER_MAP extensions', () => {
  it('maps ! to lp', () => expect(FINGER_MAP['!']).toBe('lp'))
  it('maps ? to rp', () => expect(FINGER_MAP['?']).toBe('rp'))
  it('maps : to rp', () => expect(FINGER_MAP[':']).toBe('rp'))
  it('maps " to rp', () => expect(FINGER_MAP['"']).toBe('rp'))
  it("maps ' to rp", () => expect(FINGER_MAP["'"]).toBe('rp'))
  it('maps shift_l to lp', () => expect(FINGER_MAP['shift_l']).toBe('lp'))
  it('maps shift_r to rp', () => expect(FINGER_MAP['shift_r']).toBe('rp'))
})

describe('needsShift', () => {
  it('returns true for uppercase letters', () => {
    expect(needsShift('A')).toBe(true)
    expect(needsShift('Z')).toBe(true)
  })
  it('returns true for shifted punctuation', () => {
    expect(needsShift('!')).toBe(true)
    expect(needsShift('?')).toBe(true)
    expect(needsShift(':')).toBe(true)
    expect(needsShift('"')).toBe(true)
  })
  it('returns false for lowercase letters', () => {
    expect(needsShift('a')).toBe(false)
  })
  it("returns false for unshifted punctuation", () => {
    expect(needsShift('.')).toBe(false)
    expect(needsShift(',')).toBe(false)
    expect(needsShift("'")).toBe(false)
  })
  it('returns false for null/empty', () => {
    expect(needsShift(null)).toBe(false)
    expect(needsShift('')).toBe(false)
  })
})

describe('getPhysicalKey', () => {
  it('lowercases uppercase letters', () => {
    expect(getPhysicalKey('A')).toBe('a')
    expect(getPhysicalKey('Z')).toBe('z')
  })
  it('maps shifted punctuation to base key', () => {
    expect(getPhysicalKey('!')).toBe('1')
    expect(getPhysicalKey('?')).toBe('/')
    expect(getPhysicalKey(':')).toBe(';')
    expect(getPhysicalKey('"')).toBe("'")
  })
  it('returns unshifted punctuation unchanged', () => {
    expect(getPhysicalKey('.')).toBe('.')
    expect(getPhysicalKey(',')).toBe(',')
    expect(getPhysicalKey("'")).toBe("'")
  })
})

describe('getShiftSide', () => {
  it('returns shift_r for left-hand characters (A=lp)', () => {
    expect(getShiftSide('A')).toBe('shift_r')  // a is lp → left hand → right shift
  })
  it('returns shift_l for right-hand characters (J=ri)', () => {
    expect(getShiftSide('J')).toBe('shift_l')  // j is ri → right hand → left shift
  })
  it('returns shift_l for ? (/ is rp → right hand → left shift)', () => {
    expect(getShiftSide('?')).toBe('shift_l')
  })
  it('returns shift_r for ! (1 is lp → left hand → right shift)', () => {
    expect(getShiftSide('!')).toBe('shift_r')
  })
  it('returns null for chars that do not need shift', () => {
    expect(getShiftSide('a')).toBeNull()
    expect(getShiftSide('.')).toBeNull()
  })
})

describe('getLearnedKeys with zinnen lessons', () => {
  it('includes all punctuation keys after lesson 18', () => {
    const keys = getLearnedKeys(18)
    for (const k of ['.', ',', '!', '?', ':', ';', '"', "'"]) {
      expect(keys).toContain(k)
    }
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -20
```

Expected: failures on `has 18 lessons`, all FINGER_MAP extension tests, needsShift, getPhysicalKey, getShiftSide.

- [ ] **Step 3: Add FINGER_MAP entries, helpers, and lessons**

In `src/lessons/index.js`, replace the FINGER_MAP block and add after `getFingerForKey`:

```js
export const FINGER_MAP = {
  '1':'lp','2':'lr','3':'lm','4':'li','5':'li','6':'ri','7':'ri','8':'rm','9':'rr','0':'rp',
  'q':'lp','w':'lr','e':'lm','r':'li','t':'li','y':'ri','u':'ri','i':'rm','o':'rr','p':'rp',
  'a':'lp','s':'lr','d':'lm','f':'li','g':'li','h':'ri','j':'ri','k':'rm','l':'rr',';':'rp',
  'z':'lp','x':'lr','c':'lm','v':'li','b':'li','n':'ri','m':'ri',',':'rm','.':'rr','/':'rp',
  '!':'lp','?':'rp',':':'rp','"':'rp',"'":'rp',
  'shift_l':'lp','shift_r':'rp',
}
```

Append the 5 zinnen lessons to `LESSONS`:

```js
  { id:14, group:'zinnen', keys:['shift','.'],    label:'SHIFT .' },
  { id:15, group:'zinnen', keys:[','],             label:',' },
  { id:16, group:'zinnen', keys:['?','!'],         label:'? !' },
  { id:17, group:'zinnen', keys:[':',';'],         label:': ;' },
  { id:18, group:'zinnen', keys:['"',"'"],         label:'" \'' },
```

Add helpers after `getFingerForKey`:

```js
const SHIFT_TO_PHYSICAL = { '!':'1', '?':'/', ':':';', '"':"'" }

export function needsShift(char) {
  if (!char || char.length !== 1) return false
  if (char >= 'A' && char <= 'Z') return true
  return char in SHIFT_TO_PHYSICAL
}

export function getPhysicalKey(char) {
  if (!char) return null
  if (char >= 'A' && char <= 'Z') return char.toLowerCase()
  return SHIFT_TO_PHYSICAL[char] ?? char
}

export function getShiftSide(char) {
  if (!needsShift(char)) return null
  const physKey = getPhysicalKey(char)
  const finger = FINGER_MAP[physKey]
  if (!finger) return null
  return finger.startsWith('l') ? 'shift_r' : 'shift_l'
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

Expected: all tests pass (73 + new ones).

- [ ] **Step 5: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/lessons/index.js tests/lessons/lessons.test.js
git commit -m "feat: add zinnen lessons, FINGER_MAP extensions, shift helpers"
```

---

## Task 2: Sentence data files

**Files:**
- Create: `src/lessons/zinnen/nl.json`
- Create: `src/lessons/zinnen/en.json`
- Create: `tests/lessons/zinnen.test.js`

- [ ] **Step 1: Write failing test**

Create `tests/lessons/zinnen.test.js`:

```js
import nlSentences from '../../src/lessons/zinnen/nl.json'
import enSentences from '../../src/lessons/zinnen/en.json'

describe('zinnen sentence files', () => {
  const LESSON_IDS = ['14', '15', '16', '17', '18']
  const MIN_SENTENCES = 15

  for (const id of LESSON_IDS) {
    it(`nl lesson ${id} has at least ${MIN_SENTENCES} sentences`, () => {
      expect(Array.isArray(nlSentences[id])).toBe(true)
      expect(nlSentences[id].length).toBeGreaterThanOrEqual(MIN_SENTENCES)
    })

    it(`en lesson ${id} has at least ${MIN_SENTENCES} sentences`, () => {
      expect(Array.isArray(enSentences[id])).toBe(true)
      expect(enSentences[id].length).toBeGreaterThanOrEqual(MIN_SENTENCES)
    })

    it(`nl lesson ${id} sentences are non-empty strings`, () => {
      for (const s of nlSentences[id]) {
        expect(typeof s).toBe('string')
        expect(s.length).toBeGreaterThan(0)
      }
    })

    it(`en lesson ${id} sentences are non-empty strings`, () => {
      for (const s of enSentences[id]) {
        expect(typeof s).toBe('string')
        expect(s.length).toBeGreaterThan(0)
      }
    })
  }
})
```

- [ ] **Step 2: Run — expect failures**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | grep -E "FAIL|PASS|zinnen" | head -20
```

Expected: zinnen.test.js fails (files don't exist).

- [ ] **Step 3: Create `src/lessons/zinnen/nl.json`**

```json
{
  "14": [
    "Kuiken ziet een grote berg.",
    "Jij typt als een echte held.",
    "De zon schijnt op het bos.",
    "Kuiken vindt een gouden sleutel.",
    "Jij bent de snelste typist.",
    "Het pad leidt naar het meer.",
    "Kuiken springt over de stenen.",
    "Elke dag word je beter.",
    "De vogels zingen in de boom.",
    "Kuiken draagt een rode rugzak.",
    "Jij typt zonder te kijken.",
    "Het avontuur wacht op jou.",
    "Kuiken volgt het spoor in het zand.",
    "Je vingers kennen de weg.",
    "Kuiken bereikt de top van de heuvel.",
    "Goed gedaan. Je bent geweldig.",
    "Kuiken lacht en danst van vreugde.",
    "Jij maakt Kuiken heel blij."
  ],
  "15": [
    "Kuiken pakt zijn rugzak, zijn kaart en zijn kompas.",
    "Jij typt snel, netjes en zonder fouten.",
    "Het bos is stil, donker en diep.",
    "Kuiken ziet een vos, een haas en een egel.",
    "Links, rechts, links, rechts loopt Kuiken door het bos.",
    "De rugzak is zwaar, maar Kuiken gaat door.",
    "Jij bent slim, sterk en moedig.",
    "Kuiken eet een appel, een peer en wat noten.",
    "Het water is koud, helder en fris.",
    "Kuiken kijkt omhoog, omlaag en om zich heen.",
    "Jij typt met je vingers, niet met je ogen.",
    "De weg is lang, maar het doel is dichtbij.",
    "Kuiken stopt even, ademt diep in en gaat verder.",
    "Jij bent goed bezig, echt waar.",
    "De vogels, de bomen en de beekjes maken het bos mooi.",
    "Kuiken is moe, maar hij geeft niet op."
  ],
  "16": [
    "Wat ziet Kuiken daar in de verte?",
    "Jij typt zo snel! Wauw!",
    "Waar leidt dit pad naartoe?",
    "Kuiken roept: help, er is een draak!",
    "Hoe ver is het nog?",
    "Jij hebt het gehaald! Gefeliciteerd!",
    "Is dit het geheime pad?",
    "Kuiken springt op en roept: yes!",
    "Wat een prachtig uitzicht!",
    "Ken jij de weg door het bos?",
    "Kuiken roept: kijk, een regenboog!",
    "Hoe doe jij dat zo goed?",
    "Is er iemand thuis?",
    "Kuiken danst en zingt: hoera!",
    "Wat een geweldig avontuur!",
    "Kun jij sneller typen dan Kuiken?",
    "Kuiken wint! Wat een held!",
    "Wie heeft dit spoor achtergelaten?"
  ],
  "17": [
    "Kuiken heeft drie dingen nodig: moed, kracht en geluk.",
    "Jij typt goed; dat is zeker.",
    "Kuiken zegt iets bijzonders: jij bent mijn held.",
    "Het recept is simpel: oefen elke dag.",
    "Kuiken pakt zijn spullen; hij is klaar voor het avontuur.",
    "Er zijn twee paden: links naar het meer, rechts naar de berg.",
    "Jij hebt alles wat nodig is: talent en inzet.",
    "Kuiken fluistert: luister, hoor je dat?",
    "De les van vandaag: nooit opgeven.",
    "Kuiken is blij; het doel is bereikt.",
    "Er zijn drie regels: wees snel, wees nauwkeurig en wees trots.",
    "Jij typt zo goed; Kuiken is er trots op.",
    "Kuiken denkt aan zijn vrienden: de vos, de eekhoorn en de uil.",
    "Het geheim van goed typen: kijk niet naar je handen.",
    "Kuiken rust even uit; morgen wacht een nieuw avontuur.",
    "Jij bent al ver gekomen; ga zo door."
  ],
  "18": [
    "Kuiken roept: \"Dit is het mooiste uitzicht ooit!\"",
    "Het pad heet 'De Gouden Weg'.",
    "Kuiken zegt: \"Ik ben zo trots op jou.\"",
    "Het geheime wachtwoord is 'avontuur'.",
    "\"Wauw,\" zegt Kuiken, \"jij bent echt geweldig!\"",
    "Het dagboek van Kuiken begint met: 'Vandaag was een bijzondere dag'.",
    "Kuiken fluistert: \"Luister, ik heb een geheim.\"",
    "De naam van het bos is 'Het Donkere Woud'.",
    "\"Ga zo door,\" zegt Kuiken, \"je bent bijna een meester.\"",
    "Kuikens favoriete liedje heet 'Op naar de top'.",
    "\"Ik kan het niet geloven,\" zegt Kuiken, \"jij typt als een professional!\"",
    "Het schattenkistje heeft het opschrift: 'Open alleen als je klaar bent'.",
    "Kuiken schrijft in zijn dagboek: 'Dit was de beste dag ooit'.",
    "\"Snel, snel,\" roept Kuiken, \"het avontuur wacht!\"",
    "De kaart zegt: 'Hier is de schat begraven'.",
    "Kuiken glundert en zegt: \"Jij bent de beste typist van het land!\""
  ]
}
```

- [ ] **Step 4: Create `src/lessons/zinnen/en.json`**

```json
{
  "14": [
    "Chick spots a giant mountain.",
    "You type like a true hero.",
    "The sun shines on the forest.",
    "Chick finds a golden key.",
    "You are the fastest typist.",
    "The path leads to the lake.",
    "Chick jumps over the stepping stones.",
    "Every day you get better.",
    "The birds sing in the trees.",
    "Chick carries a red backpack.",
    "You type without looking down.",
    "The adventure is waiting for you.",
    "Chick follows the trail in the sand.",
    "Your fingers know the way.",
    "Chick reaches the top of the hill.",
    "Well done. You are amazing.",
    "Chick laughs and dances with joy.",
    "You make Chick very proud."
  ],
  "15": [
    "Chick grabs his map, his compass and his flashlight.",
    "You type fast, neat and without mistakes.",
    "The forest is quiet, dark and deep.",
    "Chick spots a fox, a rabbit and a hedgehog.",
    "Left, right, left, right goes Chick through the woods.",
    "The backpack is heavy, but Chick keeps going.",
    "You are clever, strong and brave.",
    "Chick eats an apple, a pear and some nuts.",
    "The water is cold, clear and fresh.",
    "Chick looks up, down and all around.",
    "You type with your fingers, not your eyes.",
    "The road is long, but the goal is near.",
    "Chick stops for a moment, takes a deep breath and carries on.",
    "You are doing great, truly.",
    "The birds, the trees and the streams make the forest beautiful.",
    "Chick is tired, but he does not give up."
  ],
  "16": [
    "What does Chick see in the distance?",
    "You type so fast! Wow!",
    "Where does this path lead?",
    "Chick shouts: help, there is a dragon!",
    "How much further is it?",
    "You made it! Congratulations!",
    "Is this the secret path?",
    "Chick jumps up and shouts: yes!",
    "What an amazing view!",
    "Do you know the way through the forest?",
    "Chick cries: look, a rainbow!",
    "How do you do that so well?",
    "Is anybody home?",
    "Chick dances and sings: hooray!",
    "What a fantastic adventure!",
    "Can you type faster than Chick?",
    "Chick wins! What a hero!",
    "Who left this trail behind?"
  ],
  "17": [
    "Chick needs three things: courage, strength and luck.",
    "You type well; that is certain.",
    "Chick says something special: you are my hero.",
    "The recipe is simple: practice every day.",
    "Chick grabs his things; he is ready for the adventure.",
    "There are two paths: left to the lake, right to the mountain.",
    "You have everything you need: talent and dedication.",
    "Chick whispers: listen, do you hear that?",
    "The lesson of today: never give up.",
    "Chick is happy; the goal has been reached.",
    "There are three rules: be fast, be accurate and be proud.",
    "You type so well; Chick is proud of you.",
    "Chick thinks of his friends: the fox, the squirrel and the owl.",
    "The secret of good typing: do not look at your hands.",
    "Chick rests for a moment; tomorrow a new adventure awaits.",
    "You have come far; keep going."
  ],
  "18": [
    "Chick shouts: \"This is the most beautiful view ever!\"",
    "The path is called 'The Golden Road'.",
    "Chick says: \"I am so proud of you.\"",
    "The secret password is 'adventure'.",
    "\"Wow,\" says Chick, \"you are truly amazing!\"",
    "Chick's diary starts with: 'Today was a special day'.",
    "Chick whispers: \"Listen, I have a secret.\"",
    "The name of the forest is 'The Dark Wood'.",
    "\"Keep it up,\" says Chick, \"you are almost a master.\"",
    "Chick's favourite song is called 'Onwards to the top'.",
    "\"I cannot believe it,\" says Chick, \"you type like a professional!\"",
    "The treasure chest reads: 'Open only when you are ready'.",
    "Chick writes in his diary: 'This was the best day ever'.",
    "\"Quick, quick,\" shouts Chick, \"the adventure awaits!\"",
    "The map says: 'The treasure is buried here'.",
    "Chick beams and says: \"You are the best typist in the land!\""
  ]
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/lessons/zinnen/ tests/lessons/zinnen.test.js
git commit -m "feat: add zinnen sentence data (nl + en, lessons 14-18)"
```

---

## Task 3: buildSentenceSequence + SENTENCE_LISTS

**Files:**
- Modify: `src/words/index.js`
- Modify: `tests/words/words.test.js` (check if it exists first; create if not)

- [ ] **Step 1: Check existing words test file**

```bash
ls /Users/neiselin/Code/typtyptyp/tests/words/ 2>/dev/null || echo "no words tests dir"
```

- [ ] **Step 2: Write failing tests**

If `tests/words/words.test.js` exists, add to it. Otherwise create it:

```js
import { buildSentenceSequence, SENTENCE_LISTS } from '../../src/words/index.js'

describe('buildSentenceSequence', () => {
  const sentences = [
    'Chick finds a key.',
    'You are amazing.',
    'The forest is dark.',
    'Chick runs fast.',
  ]

  it('returns a string', () => {
    expect(typeof buildSentenceSequence(sentences, 200)).toBe('string')
  })

  it('result length is at least targetLength characters', () => {
    const result = buildSentenceSequence(sentences, 200)
    expect(result.length).toBeGreaterThanOrEqual(200)
  })

  it('does not add extra punctuation between sentences', () => {
    const result = buildSentenceSequence(sentences, 50)
    // Sentences joined by single space; no double periods or added commas
    expect(result).not.toMatch(/\.\s*\./)
  })

  it('works when sentences array is shorter than target (wraps)', () => {
    const short = ['Hello.', 'Hi.']
    const result = buildSentenceSequence(short, 200)
    expect(result.length).toBeGreaterThanOrEqual(200)
  })

  it('works with a single sentence (wraps)', () => {
    const result = buildSentenceSequence(['One sentence.'], 50)
    expect(result.length).toBeGreaterThanOrEqual(50)
  })
})

describe('SENTENCE_LISTS', () => {
  it('exports nl and en keys', () => {
    expect(SENTENCE_LISTS).toHaveProperty('nl')
    expect(SENTENCE_LISTS).toHaveProperty('en')
  })

  it('nl[14] is an array of strings', () => {
    expect(Array.isArray(SENTENCE_LISTS.nl['14'])).toBe(true)
  })

  it('en[18] is an array of strings', () => {
    expect(Array.isArray(SENTENCE_LISTS.en['18'])).toBe(true)
  })
})
```

- [ ] **Step 3: Run — expect failures**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | grep -E "buildSentenceSequence|SENTENCE_LISTS" | head -10
```

Expected: import failures.

- [ ] **Step 4: Implement in `src/words/index.js`**

Add at the top (after existing imports):

```js
import nlSentences from '../lessons/zinnen/nl.json'
import enSentences from '../lessons/zinnen/en.json'

export const SENTENCE_LISTS = { nl: nlSentences, en: enSentences }
```

Add the function after `buildExerciseSequence`:

```js
export function buildSentenceSequence(sentences, targetLength = 200) {
  // Fisher-Yates shuffle of a copy
  const pool = [...sentences]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }

  const result = []
  let len = 0
  let idx = 0
  while (len < targetLength) {
    const sentence = pool[idx % pool.length]
    result.push(sentence)
    len += sentence.length + 1  // +1 for the space separator
    idx++
  }
  return result.join(' ')
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/words/index.js tests/words/
git commit -m "feat: add buildSentenceSequence and SENTENCE_LISTS"
```

---

## Task 4: i18n + LessonSelectScreen

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/nl.json`
- Modify: `src/screens/LessonSelectScreen.svelte`

- [ ] **Step 1: Add i18n keys**

In `src/i18n/en.json`, add after `"lessons.group.onderrij"`:
```json
"lessons.group.zinnen": "SENTENCES",
```

In `src/i18n/nl.json`, add after `"lessons.group.onderrij"`:
```json
"lessons.group.zinnen": "ZINNEN",
```

- [ ] **Step 2: Update LessonSelectScreen**

In `src/screens/LessonSelectScreen.svelte`, replace the GROUPS/GROUP_IDS block:

```js
const GROUPS = ['thuisrij','bovenrij','onderrij','zinnen']

const GROUP_IDS = {
  thuisrij: 'home',
  bovenrij: 'top',
  onderrij: 'bottom',
  zinnen:   'sentences',
}

const NO_GAME_GROUPS = new Set(['zinnen'])
```

In the template, wrap the game tile in a conditional. Find:
```svelte
        <!-- Game tile: always available -->
        <button
          class="game-tile game-tile--unlocked"
          on:click={() => startArcade(groupId)}
        >
          <div class="game-icon">▶▶</div>
          <div class="game-lbl">GAME</div>
        </button>
```

Replace with:
```svelte
        {#if !NO_GAME_GROUPS.has(group)}
        <button
          class="game-tile game-tile--unlocked"
          on:click={() => startArcade(groupId)}
        >
          <div class="game-icon">▶▶</div>
          <div class="game-lbl">GAME</div>
        </button>
        {/if}
```

Also remove the stale `volledig` label check still in the template (line 93):
```svelte
<div class="lkeys">{lesson.label}</div>
```
(replace `lesson.group === 'volledig' ? $t('lessons.label.volledig') : lesson.label` with just `lesson.label`)

- [ ] **Step 3: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/i18n/en.json src/i18n/nl.json src/screens/LessonSelectScreen.svelte
git commit -m "feat: add zinnen group to lesson select screen"
```

---

## Task 5: ExerciseScreen — sentence mode + intro cards

**Files:**
- Modify: `src/screens/ExerciseScreen.svelte`

- [ ] **Step 1: Update imports**

At the top of the `<script>` block, change:

```js
import { LESSONS, getLearnedKeys, getFingerForKey, FINGER_VARS } from '../lessons/index.js'
import { buildExerciseSequence, WORD_LISTS } from '../words/index.js'
```

to:

```js
import { LESSONS, getLearnedKeys, getFingerForKey, getShiftSide, needsShift, FINGER_VARS } from '../lessons/index.js'
import { buildExerciseSequence, buildSentenceSequence, WORD_LISTS, SENTENCE_LISTS } from '../words/index.js'
```

- [ ] **Step 2: Branch sequence building on lesson group**

Find the `$effect` that builds the sequence (around line 43):

```js
  $effect(() => {
    if (lesson) {
      sequence = buildExerciseSequence(learnedKeys, newKeys, 200, WORD_LISTS[$lang] ?? WORD_LISTS.nl)
      cursor = 0; errors = 0; mistakeLog = []; keyLog = {}; startTime = null; scaleMeasured = false
    }
  })
```

Replace with:

```js
  $effect(() => {
    if (lesson) {
      if (lesson.group === 'zinnen') {
        const sentenceList = SENTENCE_LISTS[$lang] ?? SENTENCE_LISTS.nl
        const sentences = sentenceList[String(lesson.id)] ?? []
        sequence = buildSentenceSequence(sentences, 200)
      } else {
        sequence = buildExerciseSequence(learnedKeys, newKeys, 200, WORD_LISTS[$lang] ?? WORD_LISTS.nl)
      }
      cursor = 0; errors = 0; mistakeLog = []; keyLog = {}; startTime = null; scaleMeasured = false
    }
  })
```

- [ ] **Step 3: Update intro key cards**

Find the intro key grid (around line 166):

```svelte
      <div class="intro-key-grid">
        {#each newKeys.filter(k => /^[a-z]$/i.test(k)) as key}
          {@const finger = getFingerForKey(key)}
          {@const color  = finger ? FINGER_VARS[finger] : 'var(--text)'}
          <div class="intro-key-card" style="--kc:{color}">
            <div class="intro-key-char">{key.toUpperCase()}</div>
            <div class="intro-key-finger">{finger ? $t(`finger.${finger}`) : ''}</div>
          </div>
        {/each}
      </div>
```

Replace with:

```svelte
      <div class="intro-key-grid">
        {#each (lesson?.group === 'zinnen' ? newKeys : newKeys.filter(k => /^[a-z]$/i.test(k))) as key}
          {#if key === 'shift'}
            <div class="intro-key-card intro-key-card--wide" style="--kc:{FINGER_VARS.lp}">
              <div class="intro-key-char" style="font-size:32px">SHIFT</div>
              <div class="intro-key-finger">{$t('finger.lp')} / {$t('finger.rp')}</div>
            </div>
          {:else}
            {@const finger = getFingerForKey(key)}
            {@const color  = finger ? FINGER_VARS[finger] : 'var(--text)'}
            <div class="intro-key-card" style="--kc:{color}">
              <div class="intro-key-char">{key.toUpperCase()}</div>
              <div class="intro-key-finger">{finger ? $t(`finger.${finger}`) : ''}</div>
            </div>
          {/if}
        {/each}
      </div>
```

Add CSS for the wide shift card in the `<style>` block:

```css
  .intro-key-card--wide { padding: 20px 48px; }
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/screens/ExerciseScreen.svelte
git commit -m "feat: exercise screen sentence mode and zinnen intro cards"
```

---

## Task 6: Keyboard — Shift keys + physical key mapping

**Files:**
- Modify: `src/components/Keyboard.svelte`

- [ ] **Step 1: Update the component**

Replace the entire `Keyboard.svelte` content:

```svelte
<script>
  import { FINGER_MAP, FINGER_VARS, needsShift, getPhysicalKey, getShiftSide } from '../lessons/index.js'
  import { t } from '../i18n/index.js'

  export let activeKey = null

  // Row stagger offsets (px) — matches real ANSI keyboard proportions
  // Bottom row (index 3) gets no stagger because shift keys flank it
  const ROW_STAGGER = [0, 22, 36, 0]

  const ROWS = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.',"'",'/',],
  ]

  function colour(key) {
    return FINGER_VARS[FINGER_MAP[key]] ?? 'var(--text-muted)'
  }

  $: physKey   = getPhysicalKey(activeKey)
  $: shiftSide = getShiftSide(activeKey)   // 'shift_l', 'shift_r', or null

  function isActive(key) {
    return key === physKey
  }

  const shiftColourL = FINGER_VARS[FINGER_MAP['shift_l']]  // lp
  const shiftColourR = FINGER_VARS[FINGER_MAP['shift_r']]  // rp
</script>

<div class="keyboard">
  {#each ROWS as row, ri}
    <div class="kbd-row" style="padding-left:{ROW_STAGGER[ri]}px">
      {#if ri === 3}
        <span
          class="key key--shift"
          class:key--active={shiftSide === 'shift_l'}
          style="--kc:{shiftColourL}"
        >SHIFT</span>
      {/if}

      {#each row as key}
        <span
          class="key"
          class:key--active={isActive(key)}
          style="--kc:{colour(key)}"
        >{key.toUpperCase()}</span>
      {/each}

      {#if ri === 3}
        <span
          class="key key--shift"
          class:key--active={shiftSide === 'shift_r'}
          style="--kc:{shiftColourR}"
        >SHIFT</span>
      {/if}
    </div>
  {/each}
  <div class="kbd-row kbd-row--space">
    <span class="key key--space"
      class:key--active={activeKey === ' '}
      style="--kc:var(--accent-yellow)"
    >{$t('keyboard.space')}</span>
  </div>
</div>

<style>
  @keyframes key-active {
    0%,100% { box-shadow:0 0 6px var(--kc), 0 0 16px var(--kc), 0 0 32px var(--kc); }
    50%     { box-shadow:0 0 10px var(--kc), 0 0 28px var(--kc), 0 0 55px var(--kc); }
  }
  @keyframes space-active {
    0%,100% { box-shadow:0 0 6px var(--kc), 0 0 14px var(--kc); }
    50%     { box-shadow:0 0 10px var(--kc), 0 0 24px var(--kc); }
  }

  .keyboard {
    background:var(--bg-raised); border-radius:6px; padding:14px 16px 14px; border:1px solid var(--border);
    display:flex; flex-direction:column; gap:6px;
    width:fit-content; margin:0 auto;
  }
  .kbd-row { display:flex; gap:6px; }
  .kbd-row--space { justify-content:center; padding-left:0; margin-top:2px; }

  .key {
    font-family:'Courier New',monospace; font-size:15px; font-weight:bold;
    border-radius:6px; padding:11px 0; width:48px; text-align:center; flex-shrink:0;
    background:color-mix(in srgb, var(--kc) 15%, var(--bg-sunken)); color:var(--kc);
    border:1px solid color-mix(in srgb, var(--kc) 30%, transparent);
    border-bottom:3px solid color-mix(in srgb, var(--kc) 70%, transparent);
    text-shadow:0 0 6px var(--kc);
    box-shadow:0 2px 4px rgba(0,0,0,0.4);
    transition:background 0.05s;
  }
  .key--active {
    position:relative; z-index:1;
    background:var(--kc) !important;
    color:var(--bg) !important;
    text-shadow:none !important;
    border:2px solid rgba(255,255,255,0.6) !important;
    border-bottom:4px solid rgba(255,255,255,0.35) !important;
    font-size:17px;
    transform:scale(1.1);
    animation:key-active 0.9s ease-in-out infinite;
  }
  .key--space.key--active {
    transform:none;
    animation:space-active 0.9s ease-in-out infinite;
  }
  .key--space {
    width:auto; min-width:280px; padding:11px 24px;
    color:var(--text-muted); border-color:color-mix(in srgb,var(--text-muted) 30%,transparent);
    border-bottom-color:color-mix(in srgb,var(--text-muted) 50%,transparent);
    text-shadow:none; letter-spacing:3px;
  }
  .key--shift {
    width:auto; min-width:56px; padding:11px 10px; font-size:11px; letter-spacing:1px;
  }
</style>
```

Note: the bottom row now includes `'` and `/` so those physical keys are visible for lessons 18 and 16.

- [ ] **Step 2: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/components/Keyboard.svelte
git commit -m "feat: keyboard shift keys and physical key highlighting"
```

---

## Task 7: HandHints — dual-finger shift highlighting

**Files:**
- Modify: `src/components/HandHints.svelte`

- [ ] **Step 1: Update the component**

Replace the entire `HandHints.svelte` content:

```svelte
<script>
  import { t } from '../i18n/index.js'
  import { getFingerForKey, getShiftSide, needsShift, FINGER_VARS } from '../lessons/index.js'

  export let activeKey = null

  $: isSpace       = activeKey === ' '
  $: activeFinger  = isSpace ? 'thumb' : (activeKey ? getFingerForKey(activeKey) : null)
  $: shiftSide     = needsShift(activeKey) ? getShiftSide(activeKey) : null
  $: shiftFingerId = shiftSide === 'shift_l' ? 'lp' : shiftSide === 'shift_r' ? 'rp' : null
  $: fingerLabel   = activeFinger ? $t(`finger.${activeFinger}`) : ''

  const C = FINGER_VARS

  // [finger-id, tip-height-px]
  const LEFT  = [['lp',55],['lr',70],['lm',80],['li',65]]
  const RIGHT = [['ri',65],['rm',80],['rr',70],['rp',55]]

  function isFingerActive(f) {
    return f === activeFinger || f === shiftFingerId
  }
</script>

<div class="hand-hints">
  <!-- Left hand -->
  <div class="hand">
    <div class="hlabel">{$t('hand.left')}</div>
    <div class="fingers">
      {#each LEFT as [f, h]}
        <div class="finger" class:active={isFingerActive(f)} style="--fc:{C[f]}">
          <div class="ftip" style="height:{h}px"></div>
          <div class="fbase"></div>
        </div>
      {/each}
      <div class="finger thumb" class:active={isSpace} style="--fc:var(--accent-yellow)">
        <div class="ftip" style="height:28px;transform:rotate(10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
        <div class="fbase"></div>
      </div>
    </div>
    <div class="palm" style="background:linear-gradient(90deg,{C.lp},{C.lr},{C.lm},{C.li},{C.li})"></div>
  </div>

  <!-- Centre label -->
  <div class="hint-centre">
    <div class="hint-title">{$t('exercise.nextFinger')}</div>
    {#if activeFinger}
      {@const hintColor = isSpace ? 'var(--accent-yellow)' : C[activeFinger]}
      <div class="hint-finger" style="color:{hintColor};text-shadow:0 0 8px {hintColor}">
        {#if shiftFingerId}SHIFT +{/if}
        {fingerLabel}
      </div>
      <div class="hint-key" style="color:{hintColor}">
        {isSpace ? '⎵' : activeKey?.toUpperCase()}
      </div>
    {/if}
  </div>

  <!-- Right hand -->
  <div class="hand">
    <div class="hlabel">{$t('hand.right')}</div>
    <div class="fingers">
      <div class="finger thumb" class:active={isSpace} style="--fc:var(--accent-yellow)">
        <div class="ftip" style="height:28px;transform:rotate(-10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
        <div class="fbase"></div>
      </div>
      {#each RIGHT as [f, h]}
        <div class="finger" class:active={isFingerActive(f)} style="--fc:{C[f]}">
          <div class="ftip" style="height:{h}px"></div>
          <div class="fbase"></div>
        </div>
      {/each}
    </div>
    <div class="palm" style="background:linear-gradient(90deg,{C.ri},{C.ri},{C.rm},{C.rr},{C.rp})"></div>
  </div>
</div>

<style>
  @keyframes fglow { 0%,100%{opacity:.7} 50%{opacity:1} }

  .hand-hints { display:flex; justify-content:space-between; align-items:flex-end; padding:0 8px; margin-bottom:12px; }
  .hand { display:flex; flex-direction:column; align-items:center; gap:5px; flex-shrink:0; }
  .hlabel { font-size:12px; color:var(--text-muted); letter-spacing:1px; margin-bottom:2px; }
  .fingers { display:flex; gap:5px; align-items:flex-end; }
  .finger { display:flex; flex-direction:column; justify-content:flex-end; }
  .ftip { width:18px; border-radius:5px 5px 0 0; background:var(--fc); opacity:.3; }
  .fbase { width:18px; height:12px; background:var(--fc); opacity:.3; }
  .finger.active .ftip,
  .finger.active .fbase { opacity:1; box-shadow:0 0 12px var(--fc); animation:fglow .9s ease-in-out infinite; }
  .palm { width:96px; height:14px; border-radius:0 0 6px 6px; opacity:.2; }

  .hint-centre { flex:1; text-align:center; padding:0 24px; }
  .hint-title  { font-size:11px; color:var(--text-muted); letter-spacing:2px; margin-bottom:8px; }
  .hint-finger { font-size:20px; font-weight:bold; letter-spacing:2px; line-height:1.3; }
  .hint-key    { font-size:48px; font-weight:bold; margin-top:4px; line-height:1; }
</style>
```

- [ ] **Step 2: Run tests — expect pass**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/neiselin/Code/typtyptyp
git add src/components/HandHints.svelte
git commit -m "feat: hand hints dual-finger shift highlighting"
```

---

## Final check

- [ ] **Run full test suite**

```bash
cd /Users/neiselin/Code/typtyptyp && npm test 2>&1 | tail -15
```

Expected output:
```
Test Files  X passed
      Tests  X passed
```

No failures.
