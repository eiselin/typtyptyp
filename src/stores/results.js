import { writable } from 'svelte/store'
export const results = writable(null)
export function setResults(data) { results.set(data) }
