import { get } from 'svelte/store'
import { screen, selectedLesson, goTo, selectLesson } from '../../src/stores/screen.js'

describe('screen store', () => {
  beforeEach(() => goTo('home'))

  it('starts on home screen', () => {
    expect(get(screen)).toBe('home')
  })

  it('transitions to each valid screen', () => {
    for (const s of ['lessons','exercise','results','home']) {
      goTo(s)
      expect(get(screen)).toBe(s)
    }
  })
})

describe('selectedLesson', () => {
  it('starts null', () => {
    expect(get(selectedLesson)).toBeNull()
  })

  it('selectLesson sets the lesson id and navigates to exercise', () => {
    selectLesson(3)
    expect(get(selectedLesson)).toBe(3)
    expect(get(screen)).toBe('exercise')
  })
})
