import { LESSONS, FINGER_MAP, getLearnedKeys, getFingerForKey } from '../../src/lessons/index.js'

describe('LESSONS', () => {
  it('has 20 lessons', () => {
    expect(LESSONS).toHaveLength(20)
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
