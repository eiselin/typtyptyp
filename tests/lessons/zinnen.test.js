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
