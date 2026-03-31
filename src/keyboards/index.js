import { readable } from 'svelte/store'
import { LAYOUTS } from './layouts.js'

const STORAGE_KEY = 'typtyptyp_kblayout'
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

let current = (stored && LAYOUTS[stored]) ? stored : 'us'
let _set = null

export const kbLayout = readable(LAYOUTS[current], set => { _set = set })

export function setKbLayout(id) {
  if (!LAYOUTS[id]) return
  current = id
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id)
  if (_set) _set(LAYOUTS[id])
}
