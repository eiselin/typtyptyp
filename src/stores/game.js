import { writable } from 'svelte/store'

// Set before navigating to ResultsScreen in arcade mode.
// { score, crossings, groupId, profileName, prevBest }
export const gameResults = writable(null)
