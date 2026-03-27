import { describe, it, expect } from 'vitest'
import { getArcadeWordCycler } from '../src/words/index.js'

describe('getArcadeWordCycler', () => {
  it('returns a function', () => {
    const next = getArcadeWordCycler('home')
    expect(next).toBeTypeOf('function')
  })

  it('returns words (strings)', () => {
    const next = getArcadeWordCycler('home')
    const word = next()
    expect(word).toBeTypeOf('string')
    expect(word.length).toBeGreaterThan(0)
  })

  it('cycles without returning undefined after many calls', () => {
    const next = getArcadeWordCycler('home')
    for (let i = 0; i < 100; i++) {
      expect(next()).toBeTruthy()
    }
  })

  it('works for all group ids', () => {
    for (const group of ['home', 'top', 'bottom', 'all']) {
      const next = getArcadeWordCycler(group)
      expect(next()).toBeTruthy()
    }
  })
})
