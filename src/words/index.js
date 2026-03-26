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
