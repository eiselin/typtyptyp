import nlSentences from '../../src/lessons/zinnen/nl.json'
import enSentences from '../../src/lessons/zinnen/en.json'

describe('zinnen sentence files', () => {
  const LESSON_IDS = ['14', '15', '16', '17', '18']
  const MIN_STORIES = 3
  const MIN_SENTENCES_PER_STORY = 5

  for (const id of LESSON_IDS) {
    it(`nl lesson ${id} has ${MIN_STORIES} stories`, () => {
      expect(Array.isArray(nlSentences[id])).toBe(true)
      expect(nlSentences[id].length).toBeGreaterThanOrEqual(MIN_STORIES)
    })

    it(`en lesson ${id} has ${MIN_STORIES} stories`, () => {
      expect(Array.isArray(enSentences[id])).toBe(true)
      expect(enSentences[id].length).toBeGreaterThanOrEqual(MIN_STORIES)
    })

    it(`nl lesson ${id} stories each have at least ${MIN_SENTENCES_PER_STORY} non-empty sentences`, () => {
      for (const story of nlSentences[id]) {
        expect(Array.isArray(story)).toBe(true)
        expect(story.length).toBeGreaterThanOrEqual(MIN_SENTENCES_PER_STORY)
        for (const s of story) {
          expect(typeof s).toBe('string')
          expect(s.length).toBeGreaterThan(0)
        }
      }
    })

    it(`en lesson ${id} stories each have at least ${MIN_SENTENCES_PER_STORY} non-empty sentences`, () => {
      for (const story of enSentences[id]) {
        expect(Array.isArray(story)).toBe(true)
        expect(story.length).toBeGreaterThanOrEqual(MIN_SENTENCES_PER_STORY)
        for (const s of story) {
          expect(typeof s).toBe('string')
          expect(s.length).toBeGreaterThan(0)
        }
      }
    })
  }
})
