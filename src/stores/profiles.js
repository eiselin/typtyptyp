import { writable, get } from 'svelte/store'

export const PROFILE_COLOURS = [
  '#00ffee','#00ff88','#ffcc00','#ff4488',
  '#4488ff','#ff8844','#aa44ff','#ff44ff',
]

const STORAGE_KEY = 'typtyptyp_profiles'
const SESSION_KEY = 'typtyptyp_active'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function save(ps) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ps)) } catch {}
}

export const profiles = writable(load())
export const activeProfile = writable(null)

// Restore active profile from sessionStorage on load
try {
  const savedId = sessionStorage.getItem(SESSION_KEY)
  if (savedId) {
    const found = get(profiles).find(p => p.id === savedId)
    if (found) activeProfile.set(found)
  }
} catch {}

profiles.subscribe(save)

export function createProfile(name) {
  const trimmed = name?.trim() ?? ''
  if (!trimmed) throw new Error('empty')
  const ps = get(profiles)
  if (ps.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) throw new Error('duplicate')
  const profile = {
    id: crypto.randomUUID(),
    name: trimmed,
    colour: PROFILE_COLOURS[ps.length % PROFILE_COLOURS.length],
    createdAt: Date.now(),
    lessonProgress: {},
    lessonMistakes: {},
    keyStats: {},
  }
  profiles.update(ps => [...ps, profile])
}

export function selectProfile(id) {
  const profile = get(profiles).find(p => p.id === id) ?? null
  activeProfile.set(profile)
  try { if (profile) sessionStorage.setItem(SESSION_KEY, id) } catch {}
}

export function renameProfile(id, newName) {
  const trimmed = newName?.trim() ?? ''
  if (!trimmed) throw new Error('empty')
  const ps = get(profiles)
  if (ps.some(p => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase())) throw new Error('duplicate')
  profiles.update(ps => ps.map(p => {
    if (p.id !== id) return p
    const updated = { ...p, name: trimmed }
    if (get(activeProfile)?.id === id) activeProfile.set(updated)
    return updated
  }))
}

export function deleteProfile(id) {
  profiles.update(ps => ps.filter(p => p.id !== id))
  if (get(activeProfile)?.id === id) activeProfile.set(null)
}

const KEY_WINDOW = 50

export function updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm, mistakes = {}, keyLog = {} }) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.lessonProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }

    const prevMistakes = p.lessonMistakes?.[lessonId] ?? {}
    const mergedMistakes = { ...prevMistakes }
    for (const [expected, typedMap] of Object.entries(mistakes)) {
      mergedMistakes[expected] ??= {}
      for (const [typed, count] of Object.entries(typedMap)) {
        mergedMistakes[expected][typed] = (mergedMistakes[expected][typed] ?? 0) + count
      }
    }

    // Rolling window: append new results per key, keep last KEY_WINDOW entries
    const prevKeyStats = p.keyStats ?? {}
    const newKeyStats = { ...prevKeyStats }
    for (const [key, results] of Object.entries(keyLog)) {
      newKeyStats[key] = [...(newKeyStats[key] ?? []), ...results].slice(-KEY_WINDOW)
    }

    const updated = {
      ...p,
      lessonProgress: {
        ...p.lessonProgress,
        [lessonId]: {
          stars:        Math.max(prev.stars,        stars),
          bestAccuracy: Math.max(prev.bestAccuracy, bestAccuracy),
          bestWpm:      Math.max(prev.bestWpm,      bestWpm),
        },
      },
      lessonMistakes: {
        ...(p.lessonMistakes ?? {}),
        [lessonId]: mergedMistakes,
      },
      keyStats: newKeyStats,
    }
    if (get(activeProfile)?.id === profileId) activeProfile.set(updated)
    return updated
  }))
}

export function updateArcadeProgress(profileId, groupId, score) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.arcadeProgress?.[groupId] ?? { highScore: 0, achievedAt: null }
    if (score <= prev.highScore) return p
    const updated = {
      ...p,
      arcadeProgress: {
        ...(p.arcadeProgress ?? {}),
        [groupId]: { highScore: score, achievedAt: Date.now() },
      },
    }
    if (get(activeProfile)?.id === profileId) activeProfile.set(updated)
    return updated
  }))
}
