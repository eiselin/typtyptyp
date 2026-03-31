import { get } from 'svelte/store'
import { t, setLanguage } from '../../src/i18n/index.js'

describe('i18n', () => {
  beforeEach(() => setLanguage('nl'))

  it('returns a Dutch string for a known key', () => {
    expect(get(t)('nav.start')).toBe('▶ START')
  })

  it('returns the key itself for unknown keys', () => {
    expect(get(t)('nonexistent.key')).toBe('nonexistent.key')
  })

  it('supports interpolation', () => {
    expect(get(t)('progress.coach.earlyStart', { count: 3 })).toContain('3')
  })

  it('guide keys exist in Dutch', () => {
    setLanguage('nl')
    const translate = get(t)
    expect(translate('lessons.guide')).not.toBe('lessons.guide')
    expect(translate('guide.homeRow.title')).not.toBe('guide.homeRow.title')
    expect(translate('guide.zones.title')).not.toBe('guide.zones.title')
    expect(translate('guide.eyes.title')).not.toBe('guide.eyes.title')
    expect(translate('guide.slow.title')).not.toBe('guide.slow.title')
  })

  it('guide keys exist in English', () => {
    setLanguage('en')
    const translate = get(t)
    expect(translate('lessons.guide')).not.toBe('lessons.guide')
    expect(translate('guide.homeRow.title')).not.toBe('guide.homeRow.title')
    expect(translate('guide.zones.title')).not.toBe('guide.zones.title')
    expect(translate('guide.eyes.title')).not.toBe('guide.eyes.title')
    expect(translate('guide.slow.title')).not.toBe('guide.slow.title')
    setLanguage('nl') // reset to default
  })
})
