import { readable } from 'svelte/store'
import nl from './nl.json'
import en from './en.json'

const LANGUAGES = { nl, en }
const STORAGE_KEY = 'typtyptyp_lang'
let currentLang = (typeof localStorage !== 'undefined' && LANGUAGES[localStorage.getItem(STORAGE_KEY)]) ? localStorage.getItem(STORAGE_KEY) : 'nl'
let _tSet = null
let _langSet = null

function translate(key, vars = {}) {
  const strings = LANGUAGES[currentLang] ?? LANGUAGES.nl
  let str = strings[key] ?? key
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v).toUpperCase())
  }
  return str
}

export const t = readable(translate, (set) => { _tSet = set })
export const lang = readable(currentLang, (set) => { _langSet = set })

export function setLanguage(l) {
  if (!LANGUAGES[l]) return
  currentLang = l
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, l)
  if (_tSet) _tSet(translate)
  if (_langSet) _langSet(l)
}
