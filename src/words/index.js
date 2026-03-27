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

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCycler(arr) {
  let pool = []
  return () => {
    if (pool.length === 0) pool = shuffle([...arr])
    return pool.pop()
  }
}

export function buildExerciseSequence(learnedKeys, newKeys = [], targetLength = 200) {
  const pool = getWordPool(learnedKeys)
  const useWords = pool.length >= POOL_THRESHOLD

  let allWords, newKeyWords

  if (useWords) {
    allWords = pool
    const newKeySet = new Set(newKeys.map(k => k.toLowerCase()).filter(k => /^[a-z]$/.test(k)))
    newKeyWords = newKeySet.size > 0
      ? pool.filter(w => [...w].some(c => newKeySet.has(c)))
      : []
  } else {
    allWords = generateNonsense(learnedKeys, 40)
    const newKeySet = new Set(newKeys.map(k => k.toLowerCase()).filter(k => /^[a-z]$/.test(k)))
    newKeyWords = newKeySet.size > 0
      ? generateNonsense([...newKeySet, ...learnedKeys.filter(k => !newKeySet.has(k))].slice(0, 6), 20)
      : []
  }

  const nextAll = makeCycler(allWords)
  const nextNew = newKeyWords.length > 0 ? makeCycler(newKeyWords) : null

  const result = []
  let len = 0
  let newKeyWordCount = 0
  // Scale ratio down for tiny new-key pools to avoid a single word dominating.
  // 1 word → ~1 in 6, 2 words → ~1 in 4, 4+ words → 1 in 2.
  const targetNewKeyRatio = nextNew ? Math.min(0.5, newKeyWords.length / 8) : 0

  while (len < targetLength) {
    const currentRatio = result.length > 0 ? newKeyWordCount / result.length : 0
    const useNewKeyWord = nextNew && currentRatio < targetNewKeyRatio

    const word = useNewKeyWord ? nextNew() : nextAll()
    result.push(word)
    if (useNewKeyWord) newKeyWordCount++
    len += word.length + 1
  }

  return result.join(' ')
}
