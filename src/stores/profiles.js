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
  }
  profiles.update(ps => [...ps, profile])
}

export function selectProfile(id) {
  const profile = get(profiles).find(p => p.id === id) ?? null
  activeProfile.set(profile)
  try { if (profile) sessionStorage.setItem(SESSION_KEY, id) } catch {}
}

export function deleteProfile(id) {
  profiles.update(ps => ps.filter(p => p.id !== id))
  if (get(activeProfile)?.id === id) activeProfile.set(null)
}

export function updateProgress(profileId, lessonId, { stars, bestAccuracy, bestWpm }) {
  profiles.update(ps => ps.map(p => {
    if (p.id !== profileId) return p
    const prev = p.lessonProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }
    return {
      ...p,
      lessonProgress: {
        ...p.lessonProgress,
        [lessonId]: {
          stars:        Math.max(prev.stars,        stars),
          bestAccuracy: Math.max(prev.bestAccuracy, bestAccuracy),
          bestWpm:      Math.max(prev.bestWpm,      bestWpm),
        },
      },
    }
  }))
}
