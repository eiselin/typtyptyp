const STORAGE_KEY = 'typtyptyp_leaderboard'
const MAX_ENTRIES = 10

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
}

export function getLeaderboard() {
  return load()
}

export function clearLeaderboard() {
  save([])
}

export function submitScore(profileName, score, groupId) {
  const entries = load()
  if (entries.length >= MAX_ENTRIES && score <= entries[MAX_ENTRIES - 1].score) {
    return entries
  }
  const newEntry = { profileName, score, groupId, achievedAt: Date.now() }
  const updated = [...entries, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES)
  save(updated)
  return updated
}
