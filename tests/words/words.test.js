import { getWordPool, generateNonsense, buildExerciseSequence } from '../../src/words/index.js'

describe('getWordPool', () => {
  it('returns only words that use keys from the provided set', () => {
    const pool = getWordPool(['a','s','d','f','g','h','j','k','l'])
    for (const word of pool) {
      for (const char of word) {
        expect(['a','s','d','f','g','h','j','k','l']).toContain(char)
      }
    }
  })

  it('returns empty array when no words match the key set', () => {
    expect(getWordPool(['f','j'])).toEqual([])
  })

  it('is case-insensitive on the key set', () => {
    const lower = getWordPool(['a','s','d','f','g','h','j','k','l'])
    const upper = getWordPool(['A','S','D','F','G','H','J','K','L'])
    expect(lower).toEqual(upper)
  })
})

describe('generateNonsense', () => {
  it('returns the requested count', () => {
    expect(generateNonsense(['f','j'], 10)).toHaveLength(10)
  })

  it('each sequence uses only keys from the set', () => {
    for (const seq of generateNonsense(['f','j'], 20)) {
      for (const char of seq) {
        expect(['f','j']).toContain(char)
      }
    }
  })

  it('sequences are 2–6 characters long', () => {
    for (const seq of generateNonsense(['f','j'], 20)) {
      expect(seq.length).toBeGreaterThanOrEqual(2)
      expect(seq.length).toBeLessThanOrEqual(6)
    }
  })
})

describe('buildExerciseSequence', () => {
  it('returns a non-empty string', () => {
    const seq = buildExerciseSequence(['a','s','d','f','g','h','j','k','l'])
    expect(typeof seq).toBe('string')
    expect(seq.length).toBeGreaterThan(0)
  })

  it('only contains characters from the learned key set or spaces', () => {
    const keys = ['f','j']
    const seq = buildExerciseSequence(keys)
    for (const char of seq) {
      expect([...keys, ' ']).toContain(char)
    }
  })
})
