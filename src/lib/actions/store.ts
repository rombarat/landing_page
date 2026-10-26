'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { asUser, pgErrorCode } from '../db'
import { requireClaims, getMerchantStore } from '../auth'
import { invalidateStorefront } from '../data/storefront'
import { fail, merchantContext, type ActionResult } from '../merchant'
import { isValidStoreSlug, storeSlugFrom } from '../slug'
import { FONT_PRESET_KEYS, TEMPLATE_KEYS } from '../themes'

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ''))
  .refine((v) => v === '' || (/^\+?\d{9,13}$/.test(v)), 'מספר הטלפון לא נראה תקין')

const categories = ['bakery', 'food', 'handmade', 'gifts', 'ceramics', 'jewelry', 'fashion', 'other'] as const

export type BusinessFormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }

const businessSchema = z.object({
  name: z.string().trim().min(2, 'מה שם העסק?').max(80, 'השם ארוך מדי'),
  category: z.enum(categories, { message: 'בחרו את סוג העסק' }),
  description: z.string().trim().max(600, 'התיאור ארוך מדי'),
  phone,
  whatsapp_same: z.boolean(),
  slug: z.string().trim().toLowerCase(),
})

function issuesToFields(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const i of error.issues) out[String(i.path[0])] ??= i.message
  return out
}

export async function createStoreAction(_: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const claims = await requireClaims('/onboarding')
  const values = Object.fromEntries(['name', 'category', 'description', 'phone', 'slug'].map((k) => [k, String(formData.get(k) ?? '')]))
  const parsed = businessSchema.safeParse({ ...values, whatsapp_same: formData.get('whatsapp_same') === 'on' })
  if (!parsed.success) return { fieldErrors: issuesToFields(parsed.error), values }
  if (!parsed.data.phone) return { fieldErrors: { phone: 'צריך טלפון או וואטסאפ כדי שלקוחות יוכלו ליצור קשר' }, values }

  const slug = parsed.data.slug || storeSlugFrom(parsed.data.name)
  if (!isValidStoreSlug(slug)) {
    return { fieldErrors: { slug: 'הכתובת יכולה לכלול אותיות באנגלית, ספרות ומקפים (3–40 תווים)' }, values }
  }
  if (await getMerchantStore(claims)) redirect('/onboarding/products')

  try {
    await asUser(claims, (tx) => tx`
      select public.create_store(${parsed.data.name}, ${slug}, ${parsed.data.category}, ${parsed.data.description},
                                 ${parsed.data.phone}, ${parsed.data.whatsapp_same ? parsed.data.phone : null})`)
  } catch (error) {
    const code = pgErrorCode(error)
    if (code === 'slug_taken') return { fieldErrors: { slug: 'הכתובת הזו כבר תפוסה. נסו וריאציה אחרת.' }, values }
    if (code === 'store_exists') redirect('/onboarding/products')
    console.error('create_store failed', error)
    return { error: 'לא הצלחנו ליצור את החנות. נסו שוב.', values }
  }
  redirect('/onboarding/products')
}

/** Suggests an available slug for a business name (or checks a typed one). */
export async function checkSlug(input: string): Promise<{ slug: string; available: boolean; valid: boolean }> {
  const claims = await requireClaims()
  const store = await getMerchantStore(claims)
  const candidate = input.trim().toLowerCase()
  if (!isValidStoreSlug(candidate)) return { slug: candidate, available: false, valid: false }
  const [row] = await asUser(claims, (tx) => tx`select public.slug_is_available(${candidate}, ${store?.id ?? null}) as ok`)
  return { slug: candidate, available: Boolean(row?.ok), valid: true }
}

export async function suggestSlug(name: string): Promise<string> {
  const claims = await requireClaims()
  const base = storeSlugFrom(name)
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 34)}-${i + 1}`
    const [row] = await asUser(claims, (tx) => tx`select public.slug_is_available(${candidate}, null) as ok`)
    if (row?.ok) return candidate
  }
  return `${base.slice(0, 30)}-${Date.now().toString(36).slice(-5)}`
}

const detailsSchema = z.object({
  name: z.string().trim().min(2, 'מה שם העסק?').max(80),
  category: z.enum(categories),
  description: z.string().trim().max(600, 'התיאור ארוך מדי'),
  phone,
  whatsapp: phone,
  contact_email: z.union([z.literal(''), z.string().trim().email('כתובת המייל לא תקינה')]),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, ''))
    .refine((v) => v === '' || /^[A-Za-z0-9._]{1,30}$/.test(v), 'שם המשתמש באינסטגרם לא תקין'),
  accepting_orders: z.boolean(),
})

export async function updateStoreDetails(input: Omit<z.input<typeof detailsSchema>, "category"> & { category: string }): Promise<ActionResult> {
  const parsed = detailsSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]!.message)
  const d = parsed.data
  if (!d.phone && !d.whatsapp) return fail('צריך לפחות טלפון או וואטסאפ')
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`
    update public.stores set name = ${d.name}, category = ${d.category}, description = ${d.description},
      phone = ${d.phone || null}, whatsapp = ${d.whatsapp || null}, contact_email = ${d.contact_email || null},
      instagram = ${d.instagram || null}, accepting_orders = ${d.accepting_orders}
    where id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

const settingsSchema = z.object({
  template: z.enum(TEMPLATE_KEYS as [string, ...string[]]),
  font_preset: z.enum(FONT_PRESET_KEYS as [string, ...string[]]),
  color_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  color_accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  hero_title: z.string().trim().max(90, 'הכותרת ארוכה מדי'),
  hero_subtitle: z.string().trim().max(200, 'כותרת המשנה ארוכה מדי'),
  about_title: z.string().trim().max(80),
  about_text: z.string().trim().max(1500, 'הטקסט ארוך מדי'),
})
export type DesignInput = z.infer<typeof settingsSchema>

export async function updateDesign(input: DesignInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]!.message)
  const d = parsed.data
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`
    update public.store_settings set template = ${d.template}, font_preset = ${d.font_preset},
      color_primary = ${d.color_primary.toUpperCase()}, color_accent = ${d.color_accent.toUpperCase()},
      hero_title = ${d.hero_title}, hero_subtitle = ${d.hero_subtitle},
      about_title = ${d.about_title}, about_text = ${d.about_text}
    where store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

const pickupSchema = z.object({
  pickup_address: z.string().trim().max(200, 'הכתובת ארוכה מדי'),
  pickup_instructions: z.string().trim().max(600, 'ההנחיות ארוכות מדי'),
  pickup_requires_slot: z.boolean(),
  pickup_lead_hours: z.number().int().min(0).max(336),
  payment_note: z.string().trim().min(1, 'כדאי לכתוב ללקוחות איך משלמים').max(300),
})

export async function updatePickup(input: z.infer<typeof pickupSchema>): Promise<ActionResult> {
  const parsed = pickupSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]!.message)
  const d = parsed.data
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`
    update public.store_settings set pickup_address = ${d.pickup_address}, pickup_instructions = ${d.pickup_instructions},
      pickup_requires_slot = ${d.pickup_requires_slot}, pickup_lead_hours = ${d.pickup_lead_hours}, payment_note = ${d.payment_note}
    where store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function changeSlug(slug: string): Promise<ActionResult<{ slug: string }>> {
  const candidate = slug.trim().toLowerCase()
  if (!isValidStoreSlug(candidate)) return fail('הכתובת יכולה לכלול אותיות באנגלית, ספרות ומקפים (3–40 תווים)')
  const { store, claims } = await merchantContext()
  if (store.role !== 'owner') return fail('רק בעלי החנות יכולים לשנות את הכתובת')
  try {
    await asUser(claims, (tx) => tx`select public.change_store_slug(${store.id}, ${candidate})`)
  } catch (error) {
    if (pgErrorCode(error) === 'slug_taken') return fail('הכתובת הזו כבר תפוסה')
    throw error
  }
  invalidateStorefront(store.slug, candidate)
  return { ok: true, data: { slug: candidate } }
}

const PUBLISH_ERRORS: Record<string, string> = {
  suspended: 'החנות מושעית. פנו לתמיכה.',
  missing_name: 'חסר שם לחנות.',
  missing_contact: 'צריך טלפון או וואטסאפ כדי שלקוחות יוכלו ליצור קשר.',
  no_active_products: 'צריך לפחות מוצר אחד עם שם ומחיר.',
}

export async function publishStore(): Promise<ActionResult<{ slug: string }>> {
  const { store, claims } = await merchantContext()
  if (store.role !== 'owner') return fail('רק בעלי החנות יכולים לפרסם')
  const [row] = await asUser(claims, (tx) => tx`select public.publish_store(${store.id}) as r`)
  const result = row?.r as { ok: boolean; errors?: string[]; slug?: string }
  if (!result?.ok) return fail((result?.errors ?? []).map((e) => PUBLISH_ERRORS[e] ?? e).join(' '))
  invalidateStorefront(store.slug)
  return { ok: true, data: { slug: store.slug } }
}

export async function unpublishStore(): Promise<ActionResult> {
  const { store, claims } = await merchantContext()
  if (store.role !== 'owner') return fail('רק בעלי החנות יכולים להסתיר את החנות')
  await asUser(claims, (tx) => tx`select public.unpublish_store(${store.id})`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function removeBrandImage(kind: 'logo' | 'hero'): Promise<ActionResult> {
  const { store, claims } = await merchantContext()
  const old = await asUser(claims, async (tx) => {
    if (kind === 'logo') {
      const [r] = await tx<{ p: string | null }[]>`select logo_path as p from public.stores where id = ${store.id}`
      await tx`update public.stores set logo_path = null where id = ${store.id}`
      return r?.p ?? null
    }
    const [r] = await tx<{ p: string | null }[]>`select hero_image_path as p from public.store_settings where store_id = ${store.id}`
    await tx`update public.store_settings set hero_image_path = null where store_id = ${store.id}`
    return r?.p ?? null
  })
  const { removeImages } = await import('../storage')
  await removeImages([old])
  invalidateStorefront(store.slug)
  return { ok: true }
}
