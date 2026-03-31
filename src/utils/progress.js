import { LESSONS, getRecommendedLesson } from '../lessons/index.js'

/**
 * Returns the accuracy (0-1) for a key from its rolling stats window,
 * or null if there is not enough data (<5 presses).
 */
export function keyAccuracy(keyStats, key) {
  const results = keyStats[key]
  if (!results || results.length < 5) return null
  return results.reduce((s, v) => s + (v ? 1 : 0), 0) / results.length
}

/**
 * Returns the heatmap colour state for a physical key.
 * @param {object} keyStats - per-key boolean[]
 * @param {Set} learnedKeys - set of learned logical key strings
 * @param {object} physicalToLogical - keyboard layout mapping
 * @param {string} key - physical key string
 * @returns {'locked'|'green'|'orange'|'red'}
 */
export function keyState(keyStats, learnedKeys, physicalToLogical, key) {
  const logicalKeys = physicalToLogical[key] ?? [key]
  if (!logicalKeys.some(k => learnedKeys.has(k))) return 'locked'
  const allResults = logicalKeys.flatMap(k => keyStats[k] ?? [])
  if (allResults.length < 5) return 'green'
  const acc = allResults.filter(Boolean).length / allResults.length
  if (acc >= 0.95) return 'green'
  if (acc >= 0.80) return 'orange'
  return 'red'
}

/**
 * Finds the key with the lowest accuracy among unlocked keys with enough data,
 * and the most commonly typed wrong key for it.
 * @returns {{ key: string, topWrong: string|null } | null}
 */
export function getWorstKey(keyStats, learnedKeys, lessonMistakes) {
  const candidates = Object.entries(keyStats)
    .filter(([key]) => learnedKeys.has(key) ||
      (key.length === 1 && key >= 'A' && key <= 'Z' && learnedKeys.has('shift') && learnedKeys.has(key.toLowerCase())))
    .map(([key]) => ({ key, acc: keyAccuracy(keyStats, key) }))
    .filter(({ acc }) => acc !== null && acc < 1)
    .sort((a, b) => a.acc - b.acc)
  if (candidates.length === 0) return null
  const { key } = candidates[0]
  let topWrong = null, topCount = 0
  for (const lessonData of Object.values(lessonMistakes)) {
    if (lessonData[key]) {
      for (const [typed, c] of Object.entries(lessonData[key])) {
        if (c > topCount) { topWrong = typed; topCount = c }
      }
    }
  }
  return { key, topWrong }
}

/**
 * Returns the most relevant lesson to practice based on the worst key or
 * the general recommended next lesson.
 */
export function getPracticeLesson(worstKey, profile) {
  if (!profile) return null
  if (worstKey) {
    const key = worstKey.key
    const exactLesson = LESSONS.find(l => l.keys.includes(key))
    if (exactLesson) return exactLesson
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      const shiftLesson = LESSONS.find(l => l.keys.includes('shift'))
      if (shiftLesson) return shiftLesson
    }
  }
  return getRecommendedLesson(profile, LESSONS)
}
