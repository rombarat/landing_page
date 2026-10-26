import { describe, expect, it } from 'vitest'
import {
  agorotToInput,
  formatPhone,
  formatPrice,
  jerusalemDateString,
  jerusalemLocalToUtc,
  parsePriceToAgorot,
  toInternationalPhone,
  whatsappLink,
} from '@/lib/format'

describe('prices', () => {
  it('parses merchant input into agorot', () => {
    expect(parsePriceToAgorot('45')).toBe(4500)
    expect(parsePriceToAgorot('45.5')).toBe(4550)
    expect(parsePriceToAgorot('₪ 1,200')).toBe(120000)
    expect(parsePriceToAgorot('12.345')).toBeNull()
    expect(parsePriceToAgorot('abc')).toBeNull()
    expect(parsePriceToAgorot('')).toBeNull()
    expect(parsePriceToAgorot('200000')).toBeNull()
  })

  it('round-trips agorot for editing', () => {
    expect(agorotToInput(4500)).toBe('45')
    expect(agorotToInput(4550)).toBe('45.50')
    expect(agorotToInput(null)).toBe('')
  })

  it('formats ILS in Hebrew locale', () => {
    const text = formatPrice(18000)
    expect(text).toContain('180')
    expect(text).toContain('₪')
    expect(formatPrice(4550)).toContain('45.5')
  })
})

describe('phones', () => {
  it('normalizes Israeli numbers for WhatsApp', () => {
    expect(toInternationalPhone('050-123-4567')).toBe('972501234567')
    expect(toInternationalPhone('+972 50 123 4567')).toBe('972501234567')
    expect(toInternationalPhone('00972501234567')).toBe('972501234567')
    expect(toInternationalPhone('12')).toBeNull()
  })

  it('builds wa.me links with encoded Hebrew text', () => {
    expect(whatsappLink('0501234567', 'שלום')).toBe(`https://wa.me/972501234567?text=${encodeURIComponent('שלום')}`)
    expect(whatsappLink(null)).toBeNull()
  })

  it('formats mobile numbers for display', () => {
    expect(formatPhone('0501234567')).toBe('050-123-4567')
    expect(formatPhone('036123456')).toBe('03-612-3456')
  })
})

describe('Israel time zone', () => {
  it('converts winter wall-clock time (UTC+2)', () => {
    expect(jerusalemLocalToUtc('2026-12-15', '17:30')?.toISOString()).toBe('2026-12-15T15:30:00.000Z')
  })

  it('converts summer wall-clock time (UTC+3)', () => {
    expect(jerusalemLocalToUtc('2026-07-01', '09:00')?.toISOString()).toBe('2026-07-01T06:00:00.000Z')
  })

  it('rejects malformed input', () => {
    expect(jerusalemLocalToUtc('2026-7-1', '9:00')).toBeNull()
  })

  it('reports the Israeli calendar date', () => {
    expect(jerusalemDateString(new Date('2026-12-15T23:30:00Z'))).toBe('2026-12-16')
  })
})
