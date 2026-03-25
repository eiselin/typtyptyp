import { readable } from 'svelte/store'
import nl from './nl.json'

const LANGUAGES = { nl }
let currentLang = 'nl'
let _set = null

function translate(key, vars = {}) {
  const strings = LANGUAGES[currentLang] ?? LANGUAGES.nl
  let str = strings[key] ?? key
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v).toUpperCase())
  }
  return str
}

export const t = readable(translate, (set) => { _set = set })

export function setLanguage(lang) {
  if (!LANGUAGES[lang]) return
  currentLang = lang
  if (_set) _set(translate)
}
