import { describe, expect, it } from 'vitest'
import { isValidStoreSlug, productSlugFrom, slugify, storeSlugFrom } from '@/lib/slug'
import { contrastRatio, readableOn, storeCssVars, TEMPLATES } from '@/lib/themes'

describe('slugs', () => {
  it('transliterates Hebrew business names', () => {
    expect(storeSlugFrom('העוגות של לינוי')).toMatch(/^[a-z0-9-]+$/)
    expect(slugify('Linoy Cakes!!')).toBe('linoy-cakes')
    expect(storeSlugFrom('א')).toMatch(/^store-/)
  })

  it('always produces URL-safe product slugs', () => {
    expect(productSlugFrom('עוגת שוקולד 🎂')).toMatch(/^[a-z0-9-]+$/)
    expect(productSlugFrom('🎂')).toBe('item')
  })

  it('validates store slugs like the database', () => {
    expect(isValidStoreSlug('linoy-cakes')).toBe(true)
    expect(isValidStoreSlug('ab')).toBe(false)
    expect(isValidStoreSlug('-abc')).toBe(false)
    expect(isValidStoreSlug('a--b')).toBe(false)
    expect(isValidStoreSlug('Linoy')).toBe(false)
  })
})

describe('themes', () => {
  it('picks readable text on any primary color', () => {
    for (const c of ['#5B3A29', '#F2A900', '#FFFFFF', '#111827', '#E58FA3']) {
      expect(contrastRatio(c, readableOn(c))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('falls back to template colors for invalid input', () => {
    const vars = storeCssVars({ template: 'bold', font_preset: 'modern', color_primary: 'red', color_accent: '#zzzzzz' })
    expect(vars['--st-primary']).toBe(TEMPLATES.bold.defaultColors.primary)
    expect(vars['--st-accent']).toBe(TEMPLATES.bold.defaultColors.accent)
  })

  it('template text colors meet contrast on their backgrounds', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(contrastRatio(t.tokens.text, t.tokens.bg)).toBeGreaterThanOrEqual(7)
      expect(contrastRatio(t.tokens.muted, t.tokens.bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
