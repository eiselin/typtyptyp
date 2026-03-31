import { getWordPool, generateNonsense, buildExerciseSequence, buildSentenceSequence, SENTENCE_LISTS } from '../../src/words/index.js'

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
