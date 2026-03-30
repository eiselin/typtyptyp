import { LESSONS, FINGER_MAP, getLearnedKeys, getFingerForKey, getRecommendedLesson, needsShift, getPhysicalKey, getShiftSide } from '../../src/lessons/index.js'

describe('LESSONS', () => {
  it('has 18 lessons', () => {
    expect(LESSONS).toHaveLength(18)
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

describe('FINGER_MAP extensions', () => {
  it('maps ! to lp', () => expect(FINGER_MAP['!']).toBe('lp'))
  it('maps ? to rp', () => expect(FINGER_MAP['?']).toBe('rp'))
  it('maps : to rp', () => expect(FINGER_MAP[':']).toBe('rp'))
  it('maps " to rp', () => expect(FINGER_MAP['"']).toBe('rp'))
  it("maps ' to rp", () => expect(FINGER_MAP["'"]).toBe('rp'))
  it('maps shift_l to lp', () => expect(FINGER_MAP['shift_l']).toBe('lp'))
  it('maps shift_r to rp', () => expect(FINGER_MAP['shift_r']).toBe('rp'))
})

describe('needsShift', () => {
  it('returns true for uppercase letters', () => {
    expect(needsShift('A')).toBe(true)
    expect(needsShift('Z')).toBe(true)
  })
  it('returns true for shifted punctuation', () => {
    expect(needsShift('!')).toBe(true)
    expect(needsShift('?')).toBe(true)
    expect(needsShift(':')).toBe(true)
    expect(needsShift('"')).toBe(true)
  })
  it('returns false for lowercase letters', () => {
    expect(needsShift('a')).toBe(false)
  })
  it("returns false for unshifted punctuation", () => {
    expect(needsShift('.')).toBe(false)
    expect(needsShift(',')).toBe(false)
    expect(needsShift("'")).toBe(false)
  })
  it('returns false for null/empty', () => {
    expect(needsShift(null)).toBe(false)
    expect(needsShift('')).toBe(false)
  })
})

describe('getPhysicalKey', () => {
  it('lowercases uppercase letters', () => {
    expect(getPhysicalKey('A')).toBe('a')
    expect(getPhysicalKey('Z')).toBe('z')
  })
  it('maps shifted punctuation to base key', () => {
    expect(getPhysicalKey('!')).toBe('1')
    expect(getPhysicalKey('?')).toBe('/')
    expect(getPhysicalKey(':')).toBe(';')
    expect(getPhysicalKey('"')).toBe("'")
  })
  it('returns unshifted punctuation unchanged', () => {
    expect(getPhysicalKey('.')).toBe('.')
    expect(getPhysicalKey(',')).toBe(',')
    expect(getPhysicalKey("'")).toBe("'")
  })
})

describe('getShiftSide', () => {
  it('returns shift_r for left-hand characters (A=lp)', () => {
    expect(getShiftSide('A')).toBe('shift_r')  // a is lp → left hand → right shift
  })
  it('returns shift_l for right-hand characters (J=ri)', () => {
    expect(getShiftSide('J')).toBe('shift_l')  // j is ri → right hand → left shift
  })
  it('returns shift_l for ? (/ is rp → right hand → left shift)', () => {
    expect(getShiftSide('?')).toBe('shift_l')
  })
  it('returns shift_r for ! (1 is lp → left hand → right shift)', () => {
    expect(getShiftSide('!')).toBe('shift_r')
  })
  it('returns null for chars that do not need shift', () => {
    expect(getShiftSide('a')).toBeNull()
    expect(getShiftSide('.')).toBeNull()
  })
})

describe('getLearnedKeys with zinnen lessons', () => {
  it('includes all punctuation keys after lesson 18', () => {
    const keys = getLearnedKeys(18)
    for (const k of ['.', ',', '!', '?', ':', ';', '"', "'"]) {
      expect(keys).toContain(k)
    }
  })
})
