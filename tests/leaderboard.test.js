import { beforeEach, describe, it, expect } from 'vitest'
import { getLeaderboard, submitScore, clearLeaderboard } from '../src/stores/leaderboard.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getLeaderboard', () => {
  it('returns empty array when nothing stored', () => {
    expect(getLeaderboard()).toEqual([])
  })
})

describe('submitScore', () => {
  it('adds first score', () => {
    const result = submitScore('Emma', 1000, 'home')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ profileName: 'Emma', score: 1000, groupId: 'home' })
  })

  it('keeps top 10 sorted by score descending', () => {
    for (let i = 1; i <= 11; i++) submitScore(`Player${i}`, i * 100, 'home')
    const board = getLeaderboard()
    expect(board).toHaveLength(10)
    expect(board[0].score).toBe(1100)
    expect(board[9].score).toBe(200)
  })

  it('does not add score on exact tie with 10th entry when board is full', () => {
    for (let i = 10; i >= 1; i--) submitScore(`Player${i}`, i * 100, 'home')
    const before = getLeaderboard()
    const lowestScore = before[9].score // 100
    submitScore('Tie', lowestScore, 'home')
    expect(getLeaderboard()).toHaveLength(10)
  })

  it('adds score strictly greater than 10th entry', () => {
    for (let i = 10; i >= 1; i--) submitScore(`Player${i}`, i * 100, 'home')
    const before = getLeaderboard()
    submitScore('NewKid', before[9].score + 1, 'home')
    expect(getLeaderboard()).toHaveLength(10)
    expect(getLeaderboard().some(e => e.profileName === 'NewKid')).toBe(true)
  })
})

describe('clearLeaderboard', () => {
  it('empties the leaderboard', () => {
    submitScore('Emma', 1000, 'home')
    clearLeaderboard()
    expect(getLeaderboard()).toEqual([])
  })
})
