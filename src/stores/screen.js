import { writable } from 'svelte/store'

export const screen = writable('home')
export const selectedLesson = writable(null)

export function goTo(screenName) {
  screen.set(screenName)
}

export function selectLesson(lessonId) {
  selectedLesson.set(lessonId)
  screen.set('exercise')
}
