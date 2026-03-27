import { beforeEach, it, expect } from 'vitest'
import { get } from 'svelte/store'

beforeEach(() => {
  localStorage.clear()
})

it('updateArcadeProgress saves highScore and achievedAt', async () => {
  const { createProfile, profiles, selectProfile, updateArcadeProgress } = await import('../src/stores/profiles.js')

  createProfile('TestKid')
  const profile = get(profiles)[0]
  selectProfile(profile.id)

  updateArcadeProgress(profile.id, 'home', 5000)

  const updated = get(profiles).find(p => p.id === profile.id)
  expect(updated.arcadeProgress.home.highScore).toBe(5000)
  expect(updated.arcadeProgress.home.achievedAt).toBeTypeOf('number')
})

it('updateArcadeProgress does not overwrite a higher existing score', async () => {
  const { createProfile, profiles, updateArcadeProgress } = await import('../src/stores/profiles.js')

  createProfile('TestKid2')
  const profile = get(profiles).find(p => p.name === 'TestKid2')

  updateArcadeProgress(profile.id, 'home', 9000)
  updateArcadeProgress(profile.id, 'home', 3000)

  const updated = get(profiles).find(p => p.id === profile.id)
  expect(updated.arcadeProgress.home.highScore).toBe(9000)
})
