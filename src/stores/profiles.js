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

export function mergeProfiles(importedProfiles) {
  if (!Array.isArray(importedProfiles)) return { added: 0, updated: 0 }

  let added = 0
  let updated = 0

  profiles.update(local => {
    const result = [...local]

    for (const imp of importedProfiles) {
      if (!imp?.id || !imp?.name || !imp?.lessonProgress) continue

      const idx = result.findIndex(p => p.id === imp.id)

      if (idx === -1) {
        result.push(imp)
        added++
      } else {
        const loc = result[idx]

        // Merge lessonProgress — take max per metric
        const mergedProgress = { ...loc.lessonProgress }
        for (const [lessonId, impLp] of Object.entries(imp.lessonProgress ?? {})) {
          const locLp = mergedProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }
          mergedProgress[lessonId] = {
            stars:        Math.max(locLp.stars        ?? 0, impLp.stars        ?? 0),
            bestAccuracy: Math.max(locLp.bestAccuracy ?? 0, impLp.bestAccuracy ?? 0),
            bestWpm:      Math.max(locLp.bestWpm      ?? 0, impLp.bestWpm      ?? 0),
          }
        }

        // Merge lessonMistakes — sum counts
        const mergedMistakes = { ...(loc.lessonMistakes ?? {}) }
        for (const [lessonId, impMistakes] of Object.entries(imp.lessonMistakes ?? {})) {
          mergedMistakes[lessonId] ??= {}
          for (const [expected, typedMap] of Object.entries(impMistakes)) {
            mergedMistakes[lessonId][expected] ??= {}
            for (const [typed, count] of Object.entries(typedMap)) {
              mergedMistakes[lessonId][expected][typed] =
                (mergedMistakes[lessonId][expected][typed] ?? 0) + count
            }
          }
        }

        // Merge keyStats — concatenate (local first), trim to KEY_WINDOW
        const mergedKeyStats = { ...(loc.keyStats ?? {}) }
        for (const [key, impResults] of Object.entries(imp.keyStats ?? {})) {
          mergedKeyStats[key] = [...(mergedKeyStats[key] ?? []), ...impResults].slice(-KEY_WINDOW)
        }

        // Merge arcadeProgress — keep the higher highScore, achievedAt follows the winner
        const mergedArcade = { ...(loc.arcadeProgress ?? {}) }
        for (const [groupId, impArcade] of Object.entries(imp.arcadeProgress ?? {})) {
          const locArcade = mergedArcade[groupId] ?? { highScore: 0, achievedAt: null }
          if ((impArcade.highScore ?? 0) > (locArcade.highScore ?? 0)) {
            mergedArcade[groupId] = { highScore: impArcade.highScore, achievedAt: impArcade.achievedAt }
          }
        }

        result[idx] = {
          ...loc,
          lessonProgress: mergedProgress,
          lessonMistakes: mergedMistakes,
          keyStats:        mergedKeyStats,
          arcadeProgress:  mergedArcade,
        }
        updated++
      }
    }

    // Refresh activeProfile if its data changed
    const activeId = get(activeProfile)?.id
    if (activeId) {
      const refreshed = result.find(p => p.id === activeId)
      if (refreshed) activeProfile.set(refreshed)
    }

    return result
  })

  return { added, updated }
}
