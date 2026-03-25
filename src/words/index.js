import wordList from './nl.json'

const POOL_THRESHOLD = 50

export function getWordPool(learnedKeys) {
  const keySet = new Set(learnedKeys.map(k => k.toLowerCase()))
  return wordList.filter(word =>
    word.length >= 2 && [...word.toLowerCase()].every(c => keySet.has(c))
  )
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

export function buildExerciseSequence(learnedKeys, targetLength = 60) {
  const pool = getWordPool(learnedKeys)
  const words = pool.length >= POOL_THRESHOLD
    ? pool
    : generateNonsense(learnedKeys, 30)

  const result = []
  let len = 0
  while (len < targetLength) {
    const word = words[Math.floor(Math.random() * words.length)]
    result.push(word)
    len += word.length + 1
  }
  return result.join(' ').slice(0, targetLength).trimEnd()
}
