import { describe, it, expect } from 'vitest'

// Inline the function here — same logic as in LessonSelectScreen
const GROUP_LESSON_IDS = {
  home:   [1, 2, 3, 4, 5],
  top:    [6, 7, 8, 9, 10],
  bottom: [11, 12, 13, 14],
  all:    [15],
}

function isArcadeUnlocked(groupId, lessonProgress) {
  const ids = GROUP_LESSON_IDS[groupId] ?? []
  return ids.every(id => (lessonProgress[id]?.stars ?? 0) >= 1)
}

describe('isArcadeUnlocked', () => {
  it('returns false when progress is empty', () => {
    expect(isArcadeUnlocked('home', {})).toBe(false)
  })

  it('returns false when some lessons have 0 stars', () => {
    const progress = { 1: { stars: 1 }, 2: { stars: 0 }, 3: { stars: 1 }, 4: { stars: 1 }, 5: { stars: 1 } }
    expect(isArcadeUnlocked('home', progress)).toBe(false)
  })

  it('returns true when all lessons in group have >= 1 star', () => {
    const progress = { 1: { stars: 2 }, 2: { stars: 1 }, 3: { stars: 3 }, 4: { stars: 1 }, 5: { stars: 1 } }
    expect(isArcadeUnlocked('home', progress)).toBe(true)
  })

  it('works for single-lesson group (all)', () => {
    expect(isArcadeUnlocked('all', { 15: { stars: 1 } })).toBe(true)
    expect(isArcadeUnlocked('all', {})).toBe(false)
  })
})
