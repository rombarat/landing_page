// Hebrew → Latin transliteration for readable URL slugs (linoy-ugot).
const MAP: Record<string, string> = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch', ט: 't', י: 'y',
  כ: 'k', ך: 'ch', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p',
  ף: 'f', צ: 'tz', ץ: 'tz', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
}

export function transliterate(input: string): string {
  let out = ''
  const chars = [...input.normalize('NFKD').replace(/[֑-ׇ]/g, '')]
  chars.forEach((ch, i) => {
    const next = chars[i + 1]
    if (ch === 'ו' && next === 'ו') return // וו → v
    if (ch === 'ו' && i > 0 && /[א-ת]/.test(chars[i - 1] ?? '')) {
      out += 'o' // vowel vav inside a word
      return
    }
    if (ch === 'י' && i > 0 && /[א-ת]/.test(chars[i - 1] ?? '') && i < chars.length - 1 && /[א-ת]/.test(next ?? '')) {
      out += 'i'
      return
    }
    out += MAP[ch] ?? ch
  })
  return out
}

export function slugify(input: string, maxLength = 40): string {
  const slug = transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)
    .replace(/-$/g, '')
  return slug
}

export const STORE_SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/

export function isValidStoreSlug(slug: string): boolean {
  return STORE_SLUG_RE.test(slug) && !slug.includes('--')
}

export function storeSlugFrom(name: string): string {
  const base = slugify(name, 36)
  if (base.length >= 3) return base
  return `store-${Math.random().toString(36).slice(2, 7)}`
}

export function productSlugFrom(name: string): string {
  return slugify(name, 60) || 'item'
}
