import { get } from 'svelte/store'
import { profiles, activeProfile, createProfile, selectProfile, deleteProfile, renameProfile, updateProgress, PROFILE_COLOURS } from '../../src/stores/profiles.js'

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

