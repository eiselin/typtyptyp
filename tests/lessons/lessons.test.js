import { LESSONS, FINGER_MAP, getLearnedKeys, getFingerForKey, getRecommendedLesson } from '../../src/lessons/index.js'

describe('LESSONS', () => {
  it('has 15 lessons', () => {
    expect(LESSONS).toHaveLength(15)
  })

  it('each lesson has id, group, keys, label fields', () => {
    for (const lesson of LESSONS) {
      expect(lesson).toHaveProperty('id')
      expect(lesson).toHaveProperty('group')
      expect(lesson).toHaveProperty('keys')
      expect(lesson).toHaveProperty('label')
    }
  })
})

describe('FINGER_MAP', () => {
  it('maps f to left index', () => {
    expect(FINGER_MAP['f']).toBe('li')
  })

  it('maps j to right index', () => {
    expect(FINGER_MAP['j']).toBe('ri')
  })

  it('covers all standard QWERTY keys', () => {
    const allKeys = 'qwertyuiopasdfghjkl;zxcvbnm,./1234567890'
    for (const key of allKeys) {
      expect(FINGER_MAP[key]).toBeDefined()
    }
  })
})

describe('getLearnedKeys', () => {
  it('returns only f and j after lesson 1', () => {
    const keys = getLearnedKeys(1)
    expect(keys).toContain('f')
    expect(keys).toContain('j')
    expect(keys).toHaveLength(2)
  })

  it('accumulates keys across lessons', () => {
    const keys = getLearnedKeys(2)
    expect(keys).toContain('f')
    expect(keys).toContain('j')
    expect(keys).toContain('d')
    expect(keys).toContain('k')
  })
})

describe('getFingerForKey', () => {
  it('returns the correct finger id', () => {
    expect(getFingerForKey('f')).toBe('li')
    expect(getFingerForKey('J')).toBe('ri') // case-insensitive
  })

  it('returns null for unknown keys', () => {
    expect(getFingerForKey('€')).toBeNull()
  })
})

describe('getRecommendedLesson', () => {
  const emptyProfile = { lessonProgress: {}, keyStats: {} }

  // Step 1: no data
  it('returns lesson 1 when keyStats is empty', () => {
    expect(getRecommendedLesson(emptyProfile, LESSONS)).toBe(LESSONS[0])
  })

  it('returns lesson 1 when no key has 5+ presses', () => {
    const profile = {
      lessonProgress: {},
      keyStats: { f: [true, true, true] },
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[0])
  })

  // Step 2: struggling key
  it('returns lesson 1 when f (introduced in L1) is struggling', () => {
    const profile = {
      lessonProgress: { 1: { stars: 1, bestAccuracy: 90, bestWpm: 10 } },
      keyStats: { f: Array(10).fill(false) }, // 0% accuracy
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[0])
  })

  it('returns lesson 2 when d (introduced in L2) is struggling, not f', () => {
    const profile = {
      lessonProgress: {},
      keyStats: {
        f: Array(10).fill(true),       // 100% — fine
        j: Array(10).fill(true),
        d: [...Array(8).fill(true), false, false], // ~80% — struggling
        k: Array(10).fill(true),
      },
    }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  it('does not flag a key with exactly 0.95 accuracy as struggling', () => {
    // 19/20 = 0.95 — not < 0.95, so step 2 skips it
    const profile = {
      lessonProgress: {
        1: { stars: 1, bestAccuracy: 95, bestWpm: 15 },
        2: { stars: 0, bestAccuracy: 0, bestWpm: 0 },
      },
      keyStats: {
        f: [...Array(19).fill(true), false], // exactly 0.95
      },
    }
    // step 2 finds no struggling key → step 3 returns lesson 2 (first unplayed)
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  it('skips a key with fewer than 5 presses in step 2', () => {
    const profile = {
      lessonProgress: {
        1: { stars: 1, bestAccuracy: 90, bestWpm: 10 },
      },
      keyStats: {
        f: Array(10).fill(true),         // ≥5 presses, 100% — step 1 passes, step 2 fine
        j: [false, false, false, false], // 4 presses — step 2 skips this key
      },
    }
    // step 1: hasKeyData=true (f has 10 presses)
    // step 2: L1 newKeys=[f,j] — f fine, j has <5 presses (skipped); no struggling key found
    // step 3: lesson 2 is first unplayed
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[1])
  })

  // Step 3: first unplayed
  it('returns the first unplayed lesson when no key is struggling', () => {
    const profile = {
      lessonProgress: {
        1: { stars: 2, bestAccuracy: 98, bestWpm: 20 },
        2: { stars: 1, bestAccuracy: 96, bestWpm: 15 },
      },
      keyStats: {
        f: Array(10).fill(true),
        j: Array(10).fill(true),
        d: Array(10).fill(true),
        k: Array(10).fill(true),
      },
    }
    // lessons 1 and 2 done, lesson 3 is first unplayed
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[2])
  })

  // Step 4: all played, return lowest bestAccuracy
  it('returns lesson with lowest bestAccuracy when all lessons are played', () => {
    const lessonProgress = {}
    for (const lesson of LESSONS) {
      lessonProgress[lesson.id] = { stars: 1, bestAccuracy: 90, bestWpm: 10 }
    }
    lessonProgress[3].bestAccuracy = 70 // lesson id 3 (LESSONS[2]) is worst

    const keyStats = {}
    for (const key of 'fjasdkl'.split('')) {
      keyStats[key] = Array(10).fill(true)
    }

    const profile = { lessonProgress, keyStats }
    expect(getRecommendedLesson(profile, LESSONS)).toBe(LESSONS[2]) // lesson id 3 = index 2
  })
})
