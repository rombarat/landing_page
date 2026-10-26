export const TIME_ZONE = 'Asia/Jerusalem'
export const LOCALE = 'he-IL'

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Prices are stored as integer agorot. */
export function formatPrice(agorot: number | null | undefined): string {
  if (agorot == null) return ''
  const shekels = agorot / 100
  return priceFormatter.format(shekels)
}

/** Parses user input like "45", "45.5", "₪45", "1,200" into agorot. */
export function parsePriceToAgorot(input: string): number | null {
  const cleaned = input.replace(/[₪,\s]/g, '').replace(/[^\d.]/g, '')
  if (!cleaned || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const value = Math.round(Number(cleaned) * 100)
  return Number.isFinite(value) && value <= 10_000_000 ? value : null
}

export function agorotToInput(agorot: number | null | undefined): string {
  if (agorot == null) return ''
  return agorot % 100 === 0 ? String(agorot / 100) : (agorot / 100).toFixed(2)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(value),
  )
}

export function formatRelativeDays(days: number): string {
  return new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' }).format(days, 'day')
}

/** Normalizes an Israeli phone number to international digits (9725XXXXXXXX). */
export function toInternationalPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `972${digits.slice(1)}`
  if (digits.length < 9 || digits.length > 15) return null
  return digits
}

export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  const intl = toInternationalPhone(phone)
  if (!intl) return null
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function shareOnWhatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/** Displays 0501234567 as 050-123-4567; leaves other formats untouched. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const d = phone.replace(/\D/g, '')
  if (/^05\d{8}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (/^0[2-9]\d{7}$/.test(d)) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
  return phone
}

export function pluralHe(count: number, one: string, many: string): string {
  return count === 1 ? one : `${count.toLocaleString(LOCALE)} ${many}`
}

function jerusalemOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - instant.getTime()) / 60000)
}

/** Converts a wall-clock date ("2026-11-02") and time ("17:30") in Israel to a UTC Date. */
export function jerusalemLocalToUtc(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !t) return null
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]))
  let result = guess - jerusalemOffsetMinutes(new Date(guess)) * 60000
  // Second pass settles the offset around DST changes.
  result = guess - jerusalemOffsetMinutes(new Date(result)) * 60000
  return Number.isNaN(result) ? null : new Date(result)
}

/** "YYYY-MM-DD" for a moment, as seen in Israel. */
export function jerusalemDateString(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant)
}
