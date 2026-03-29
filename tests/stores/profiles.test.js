import { get } from 'svelte/store'
import { profiles, activeProfile, createProfile, selectProfile, deleteProfile, renameProfile, updateProgress, mergeProfiles, PROFILE_COLOURS } from '../../src/stores/profiles.js'

const storageMock = (() => {
  let store = {}
  return {
    getItem:  k => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v) },
    removeItem: k => { delete store[k] },
    clear:    () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage',   { value: storageMock, writable: true })
Object.defineProperty(global, 'sessionStorage',  { value: storageMock, writable: true })

describe('PROFILE_COLOURS', () => {
  it('has exactly 8 entries', () => {
    expect(PROFILE_COLOURS).toHaveLength(8)
  })
})

describe('createProfile', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('adds a profile with auto-assigned colour', () => {
    createProfile('Fleur')
    const ps = get(profiles)
    expect(ps).toHaveLength(1)
    expect(ps[0].name).toBe('Fleur')
    expect(ps[0].colour).toBe(PROFILE_COLOURS[0])
  })

  it('rejects duplicate names (case-insensitive)', () => {
    createProfile('Fleur')
    expect(() => createProfile('fleur')).toThrow('duplicate')
  })

  it('rejects empty name', () => {
    expect(() => createProfile('')).toThrow('empty')
    expect(() => createProfile('   ')).toThrow('empty')
  })

  it('cycles colour after 8 profiles', () => {
    for (let i = 0; i < 9; i++) createProfile(`User${i}`)
    expect(get(profiles)[8].colour).toBe(PROFILE_COLOURS[0])
  })
})

describe('selectProfile', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('sets activeProfile', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    selectProfile(id)
    expect(get(activeProfile)?.name).toBe('Fleur')
  })
})

describe('renameProfile', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('renames the profile', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    renameProfile(id, 'Rosa')
    expect(get(profiles)[0].name).toBe('Rosa')
  })

  it('rejects empty name', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    expect(() => renameProfile(id, '')).toThrow('empty')
  })

  it('rejects duplicate name', () => {
    createProfile('Fleur')
    createProfile('Rosa')
    const id = get(profiles)[0].id
    expect(() => renameProfile(id, 'rosa')).toThrow('duplicate')
  })

  it('updates activeProfile when renaming the active profile', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    selectProfile(id)
    renameProfile(id, 'Rosa')
    expect(get(activeProfile)?.name).toBe('Rosa')
  })
})

describe('deleteProfile', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('removes the profile', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    deleteProfile(id)
    expect(get(profiles)).toHaveLength(0)
  })
})

describe('updateProgress', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('saves lesson result', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    updateProgress(id, 1, { stars: 2, bestAccuracy: 85, bestWpm: 18 })
    expect(get(profiles)[0].lessonProgress[1].stars).toBe(2)
  })

  it('does not downgrade stars', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    updateProgress(id, 1, { stars: 3, bestAccuracy: 97, bestWpm: 22 })
    updateProgress(id, 1, { stars: 1, bestAccuracy: 70, bestWpm: 10 })
    expect(get(profiles)[0].lessonProgress[1].stars).toBe(3)
  })
})

describe('mergeProfiles', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('adds a new profile from the import', () => {
    const imported = [{
      id: 'abc-123', name: 'Imported', colour: '#00ffee',
      createdAt: Date.now(), lessonProgress: { 1: { stars: 2, bestAccuracy: 85, bestWpm: 20 } },
      lessonMistakes: {}, keyStats: {},
    }]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(1)
    expect(updated).toBe(0)
    expect(get(profiles)).toHaveLength(1)
    expect(get(profiles)[0].name).toBe('Imported')
  })

  it('merges lesson progress taking the max', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    updateProgress(id, 1, { stars: 2, bestAccuracy: 85, bestWpm: 20 })

    const imported = [{
      id,
      name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: { 1: { stars: 1, bestAccuracy: 90, bestWpm: 15 } },
      lessonMistakes: {}, keyStats: {},
    }]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(0)
    expect(updated).toBe(1)
    const lp = get(profiles)[0].lessonProgress[1]
    expect(lp.stars).toBe(2)         // local wins
    expect(lp.bestAccuracy).toBe(90) // imported wins
    expect(lp.bestWpm).toBe(20)      // local wins
  })

  it('keeps local name and colour on conflict', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    const localColour = get(profiles)[0].colour

    const imported = [{
      id, name: 'DIFFERENT', colour: '#ff0000',
      createdAt: Date.now(), lessonProgress: {}, lessonMistakes: {}, keyStats: {},
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].name).toBe('Fleur')
    expect(get(profiles)[0].colour).toBe(localColour)
  })

  it('takes imported arcade highScore when it is higher', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: {}, lessonMistakes: {}, keyStats: {},
      arcadeProgress: { home: { highScore: 500, achievedAt: 9999 } },
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].arcadeProgress.home.highScore).toBe(500)
    expect(get(profiles)[0].arcadeProgress.home.achievedAt).toBe(9999)
  })

  it('keeps local arcade highScore when it is higher', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    profiles.update(ps => ps.map(p => p.id === id
      ? { ...p, arcadeProgress: { home: { highScore: 800, achievedAt: 1111 } } }
      : p))

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: {}, lessonMistakes: {}, keyStats: {},
      arcadeProgress: { home: { highScore: 300, achievedAt: 9999 } },
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].arcadeProgress.home.highScore).toBe(800)
    expect(get(profiles)[0].arcadeProgress.home.achievedAt).toBe(1111)
  })

  it('refreshes activeProfile after merge', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    selectProfile(id)

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: { 1: { stars: 3, bestAccuracy: 97, bestWpm: 30 } },
      lessonMistakes: {}, keyStats: {},
    }]
    mergeProfiles(imported)
    expect(get(activeProfile)?.lessonProgress[1].stars).toBe(3)
  })

  it('skips malformed profiles silently', () => {
    const imported = [
      { id: 'x' }, // missing name and lessonProgress
      null,
      { name: 'No ID', lessonProgress: {} },
    ]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(0)
    expect(updated).toBe(0)
    expect(get(profiles)).toHaveLength(0)
  })

  it('returns { added:0, updated:0 } for non-array input', () => {
    const result = mergeProfiles(null)
    expect(result).toEqual({ added: 0, updated: 0 })
  })

  it('sums lessonMistakes counts on merge', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    updateProgress(id, 1, { stars: 1, bestAccuracy: 80, bestWpm: 15, mistakes: { f: { d: 3 } } })

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: {}, lessonMistakes: { 1: { f: { d: 2, g: 1 } } }, keyStats: {},
    }]
    mergeProfiles(imported)
    const mistakes = get(profiles)[0].lessonMistakes[1]
    expect(mistakes.f.d).toBe(5) // 3 + 2
    expect(mistakes.f.g).toBe(1) // new key from imported
  })
})

