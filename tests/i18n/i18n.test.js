import { get } from 'svelte/store'
import { t, setLanguage } from '../../src/i18n/index.js'

describe('i18n', () => {
  it('returns a Dutch string for a known key', () => {
    expect(get(t)('nav.start')).toBe('▶ START')
  })

  it('returns the key itself for unknown keys', () => {
    expect(get(t)('nonexistent.key')).toBe('nonexistent.key')
  })

  it('supports interpolation with uppercased value', () => {
    expect(get(t)('home.continueAs', { name: 'Fleur' })).toBe('▶ VERDER ALS FLEUR')
  })
})
