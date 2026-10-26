/**
 * Storefront themes are configuration, not code copies. Every template renders
 * with the same components; a template changes layout variants and base tokens,
 * the merchant's colors and font preset are layered on top as CSS variables.
 */

export type TemplateKey = 'boutique' | 'artisan' | 'bold'
export type FontPresetKey = 'elegant' | 'warm' | 'modern' | 'classic'

export type TemplateDef = {
  key: TemplateKey
  name: string
  tagline: string
  fits: string
  defaultFont: FontPresetKey
  defaultColors: { primary: string; accent: string }
  /** Base surface tokens; merchant colors override primary/accent only. */
  tokens: { bg: string; surface: string; text: string; muted: string; line: string }
  radius: { card: string; button: string; image: string }
}

export const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  boutique: {
    key: 'boutique',
    name: 'בוטיק',
    tagline: 'אלגנטי ומרווח',
    fits: 'תכשיטים, קרמיקה, מתנות ועבודות יד',
    defaultFont: 'elegant',
    defaultColors: { primary: '#2B2230', accent: '#A88B5A' },
    tokens: { bg: '#F7F6F3', surface: '#FFFFFF', text: '#1E1A21', muted: '#6B6470', line: '#E4E0DA' },
    radius: { card: '0px', button: '999px', image: '2px' },
  },
  artisan: {
    key: 'artisan',
    name: 'סדנה',
    tagline: 'חם, ביתי ומזמין',
    fits: 'מאפיות, אוכל ביתי, קינוחים ועסקים מהבית',
    defaultFont: 'warm',
    defaultColors: { primary: '#5B3A29', accent: '#C2416B' },
    tokens: { bg: '#FFF9F2', surface: '#FFFFFF', text: '#2E211B', muted: '#7A665B', line: '#F0E2D3' },
    radius: { card: '20px', button: '14px', image: '16px' },
  },
  bold: {
    key: 'bold',
    name: 'נועז',
    tagline: 'חד, עכשווי ובולט',
    fits: 'מוצרים עכשוויים, אקססוריז ומותגים יצירתיים',
    defaultFont: 'modern',
    defaultColors: { primary: '#1E2A78', accent: '#F2A900' },
    tokens: { bg: '#FFFFFF', surface: '#FFFFFF', text: '#0E0F14', muted: '#565A66', line: '#0E0F14' },
    radius: { card: '0px', button: '0px', image: '0px' },
  },
}

export type FontPresetDef = { key: FontPresetKey; name: string; display: string; body: string; displayWeight: number }

export const FONT_PRESETS: Record<FontPresetKey, FontPresetDef> = {
  elegant: { key: 'elegant', name: 'אלגנטי', display: "'Bellefair', serif", body: "'Assistant', sans-serif", displayWeight: 400 },
  warm: { key: 'warm', name: 'חם', display: "'Suez One', serif", body: "'Varela Round', sans-serif", displayWeight: 400 },
  modern: { key: 'modern', name: 'מודרני', display: "'Rubik', sans-serif", body: "'Rubik', sans-serif", displayWeight: 800 },
  classic: { key: 'classic', name: 'קלאסי', display: "'Frank Ruhl Libre', serif", body: "'Assistant', sans-serif", displayWeight: 500 },
}

export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as TemplateKey[]
export const FONT_PRESET_KEYS = Object.keys(FONT_PRESETS) as FontPresetKey[]

export const COLOR_SWATCHES: Array<{ primary: string; accent: string; name: string }> = [
  { name: 'קקאו ופטל', primary: '#5B3A29', accent: '#C2416B' },
  { name: 'שזיף ופליז', primary: '#2B2230', accent: '#A88B5A' },
  { name: 'כחול וחרדל', primary: '#1E2A78', accent: '#F2A900' },
  { name: 'זית ותפוז', primary: '#3F5A2A', accent: '#D9822B' },
  { name: 'ים וחול', primary: '#0F4C5C', accent: '#E3B23C' },
  { name: 'גרפיט ואלמוג', primary: '#22252B', accent: '#E2483D' },
  { name: 'יין וורוד', primary: '#5E1F35', accent: '#E58FA3' },
  { name: 'יער ושמנת', primary: '#24443A', accent: '#C9A227' },
]

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Text color that stays readable on the given background. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#111111') ? '#FFFFFF' : '#111111'
}

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export type StoreThemeInput = {
  template: TemplateKey
  font_preset: FontPresetKey
  color_primary: string
  color_accent: string
}

/** CSS custom properties applied on the storefront root element. */
export function storeCssVars(theme: StoreThemeInput): Record<string, string> {
  const tpl = TEMPLATES[theme.template] ?? TEMPLATES.artisan
  const font = FONT_PRESETS[theme.font_preset] ?? FONT_PRESETS[tpl.defaultFont]
  const primary = isHexColor(theme.color_primary) ? theme.color_primary : tpl.defaultColors.primary
  const accent = isHexColor(theme.color_accent) ? theme.color_accent : tpl.defaultColors.accent
  return {
    '--st-bg': tpl.tokens.bg,
    '--st-surface': tpl.tokens.surface,
    '--st-text': tpl.tokens.text,
    '--st-muted': tpl.tokens.muted,
    '--st-line': tpl.tokens.line,
    '--st-primary': primary,
    '--st-on-primary': readableOn(primary),
    '--st-accent': accent,
    '--st-on-accent': readableOn(accent),
    '--st-font-display': font.display,
    '--st-font-body': font.body,
    '--st-display-weight': String(font.displayWeight),
    '--st-radius-card': tpl.radius.card,
    '--st-radius-button': tpl.radius.button,
    '--st-radius-image': tpl.radius.image,
  }
}

export const STORE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'bakery', label: 'מאפה ועוגות' },
  { value: 'food', label: 'אוכל ביתי' },
  { value: 'handmade', label: 'עבודות יד' },
  { value: 'gifts', label: 'מתנות' },
  { value: 'ceramics', label: 'קרמיקה' },
  { value: 'jewelry', label: 'תכשיטים' },
  { value: 'fashion', label: 'אופנה ואקססוריז' },
  { value: 'other', label: 'משהו אחר' },
]
