'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import { asService, pgErrorCode } from '../db'
import { serverEnv } from '../env'
import { jerusalemLocalToUtc } from '../format'
import { rateLimit } from '../rate-limit'

const schema = z.object({
  slug: z.string().min(3).max(40),
  name: z.string().trim().min(2, 'נשמח לשם מלא').max(80, 'השם ארוך מדי'),
  phone: z
    .string()
    .trim()
    .refine((v) => /^[0-9+() -]{9,20}$/.test(v) && v.replace(/\D/g, '').length >= 9 && v.replace(/\D/g, '').length <= 13, 'מספר הטלפון לא נראה תקין'),
  email: z.union([z.literal(''), z.string().trim().email('כתובת המייל לא תקינה')]),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  notes: z.string().trim().max(1000, 'ההערות ארוכות מדי'),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1, 'העגלה ריקה').max(50),
  idempotencyKey: z.string().uuid(),
  website: z.string().max(0).optional(),
  startedAt: z.number(),
})

export type CheckoutInput = z.input<typeof schema>
export type CheckoutResult =
  | { ok: true; orderNumber: number; token: string }
  | { ok: false; error: string; field?: string; refresh?: boolean }

const ERRORS: Record<string, { error: string; field?: string; refresh?: boolean }> = {
  rate_limited: { error: 'נשלחו כמה הזמנות ברצף. נסו שוב בעוד כמה דקות, או צרו קשר עם העסק.' },
  invalid_name: { error: 'נשמח לשם מלא', field: 'name' },
  invalid_phone: { error: 'מספר הטלפון לא נראה תקין', field: 'phone' },
  invalid_email: { error: 'כתובת המייל לא תקינה', field: 'email' },
  invalid_notes: { error: 'ההערות ארוכות מדי', field: 'notes' },
  pickup_required: { error: 'צריך לבחור מועד איסוף', field: 'pickup' },
  invalid_pickup: { error: 'מועד האיסוף לא אפשרי. בחרו מועד מאוחר יותר.', field: 'pickup' },
  product_unavailable: { error: 'חלק מהמוצרים בעגלה כבר לא זמינים. רעננו את העגלה ונסו שוב.', refresh: true },
  invalid_items: { error: 'משהו בעגלה לא תקין. רעננו את העמוד ונסו שוב.', refresh: true },
  invalid_quantity: { error: 'אחת הכמויות לא תקינה.', refresh: true },
  store_not_found: { error: 'החנות לא נמצאה.' },
  store_closed: { error: 'החנות לא מקבלת הזמנות כרגע.' },
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? '') }
  }
  const d = parsed.data
  // Spam mitigation: hidden honeypot field and a minimum time on the form.
  if (d.website || Date.now() - d.startedAt < 2500) return { ok: false, error: 'לא הצלחנו לשלוח את ההזמנה. נסו שוב בעוד רגע.' }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  if (!rateLimit(`order:${ip}`, 8, 10 * 60_000)) return { ok: false, ...ERRORS.rate_limited! }
  const ipHash = createHash('sha256').update(`${serverEnv.orderIpSalt}:${ip}`).digest('hex').slice(0, 32)

  let pickupAt: Date | null = null
  if (d.pickupDate || d.pickupTime) {
    pickupAt = jerusalemLocalToUtc(d.pickupDate ?? '', d.pickupTime ?? '')
    if (!pickupAt) return { ok: false, error: 'צריך לבחור גם תאריך וגם שעה', field: 'pickup' }
  }

  try {
    const [row] = await asService((tx) => tx`
      select public.place_order(${d.slug}, ${d.name}, ${d.phone}, ${d.email || null}, ${pickupAt}, ${d.notes},
                                ${tx.json(d.items)}, ${d.idempotencyKey}, ${ipHash}) as r`)
    const r = row!.r as { order_number: number; token: string }
    return { ok: true, orderNumber: r.order_number, token: r.token }
  } catch (error) {
    const code = pgErrorCode(error) ?? ''
    const mapped = ERRORS[code]
    if (mapped) return { ok: false, ...mapped }
    console.error('place_order failed', error)
    return { ok: false, error: 'לא הצלחנו לשלוח את ההזמנה. ההזמנה לא נשלחה. נסו שוב.' }
  }
}
