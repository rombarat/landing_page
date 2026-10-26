'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { placeOrder } from '@/lib/actions/checkout'
import { cn } from '@/lib/cn'
import { formatPrice, jerusalemDateString } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { PublicProduct, StoreSettings } from '@/lib/types'
import { useReconciledCart } from './cart'

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'pickup' | 'notes' | 'form', string>>

export function CheckoutForm({ slug, products, settings, basePath, canOrder, closedMessage }: { slug: string; products: PublicProduct[]; settings: StoreSettings; basePath: string; canOrder: boolean; closedMessage: string }) {
  const router = useRouter()
  const { valid, total, ready, clear } = useReconciledCart(products)
  const [errors, setErrors] = useState<Errors>({})
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  // One key per checkout attempt: retries after a network error can't create a second order.
  const idempotencyKey = useRef<string>(null)
  const [startedAt] = useState(() => Date.now())
  const minPickup = new Date(startedAt + settings.pickup_lead_hours * 3600_000)
  const minDate = jerusalemDateString(minPickup)

  if (!ready) return <div className="h-64" aria-busy />
  if (valid.length === 0 && !submitted) {
    return (
      <div className="py-16 text-center">
        <h2 className="st-display text-2xl">אין מה להזמין עדיין</h2>
        <p className="st-muted mt-2">העגלה ריקה או שהמוצרים בה כבר לא זמינים.</p>
        <Link href={basePath} className="st-btn st-btn-primary mt-6 inline-flex">
          חזרה לחנות
        </Link>
      </div>
    )
  }

  const onSubmit = (form: FormData) => {
    if (pending || submitted) return
    idempotencyKey.current ??= crypto.randomUUID()
    const input = {
      slug,
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      email: String(form.get('email') ?? ''),
      pickupDate: String(form.get('pickupDate') ?? ''),
      pickupTime: String(form.get('pickupTime') ?? ''),
      notes: String(form.get('notes') ?? ''),
      website: String(form.get('website') ?? ''),
      items: valid.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      idempotencyKey: idempotencyKey.current,
      startedAt,
    }
    const local: Errors = {}
    if (input.name.trim().length < 2) local.name = 'נשמח לשם מלא'
    if (input.phone.replace(/\D/g, '').length < 9) local.phone = 'צריך מספר טלפון כדי שהעסק יוכל לחזור אליכם'
    if (settings.pickup_requires_slot && (!input.pickupDate || !input.pickupTime)) local.pickup = 'צריך לבחור תאריך ושעה לאיסוף'
    if (Object.keys(local).length) {
      setErrors(local)
      return
    }
    setErrors({})
    startTransition(async () => {
      try {
        const res = await placeOrder(input)
        if (res.ok) {
          setSubmitted(true)
          clear()
          router.replace(`${basePath}/order-success?t=${res.token}`)
          return
        }
        setErrors(res.field ? { [res.field]: res.error } : { form: res.error })
        if (res.refresh) router.refresh()
      } catch {
        setErrors({ form: 'החיבור נקטע. ההזמנה אולי לא נשלחה. אפשר לנסות שוב בבטחה, היא לא תישלח פעמיים.' })
      }
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]" noValidate>
      <div className="space-y-5">
        {!canOrder && <p className="st-notice p-4 text-sm font-medium">{closedMessage}</p>}
        {errors.form && (
          <p className="st-notice p-4 text-sm font-medium" role="alert">
            {errors.form}
          </p>
        )}
        <StoreField id="name" label="שם מלא" error={errors.name}>
          <input id="name" name="name" autoComplete="name" required maxLength={80} className="st-input" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'name-error' : undefined} />
        </StoreField>
        <StoreField id="phone" label="טלפון" error={errors.phone} hint="העסק יחזור אליכם למספר הזה">
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required dir="ltr" className="st-input text-end" placeholder="050-1234567" aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'} />
        </StoreField>
        <StoreField id="email" label="מייל" optional error={errors.email}>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" className="st-input text-end" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'email-error' : undefined} />
        </StoreField>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">
            מתי לאסוף?{!settings.pickup_requires_slot && <span className="st-muted font-normal"> (לא חובה)</span>}
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <input name="pickupDate" type="date" min={minDate} className="st-input" aria-label="תאריך איסוף" required={settings.pickup_requires_slot} aria-invalid={errors.pickup ? true : undefined} />
            <input name="pickupTime" type="time" step={900} className="st-input" aria-label="שעת איסוף" required={settings.pickup_requires_slot} aria-invalid={errors.pickup ? true : undefined} />
          </div>
          {settings.pickup_lead_hours > 0 && <p className="st-muted mt-1.5 text-sm">אפשר לאסוף החל מ־{settings.pickup_lead_hours} שעות אחרי ההזמנה. העסק יאשר את המועד.</p>}
          {errors.pickup && (
            <p className="mt-1.5 text-sm font-semibold text-[#b42318]" role="alert">
              {errors.pickup}
            </p>
          )}
        </fieldset>
        <StoreField id="notes" label="הערות להזמנה" optional error={errors.notes}>
          <textarea id="notes" name="notes" rows={3} maxLength={1000} className="st-input py-3" placeholder="למשל: כיתוב על העוגה, בלי אגוזים…" />
        </StoreField>
        {/* Honeypot for bots: hidden from people and assistive tech. */}
        <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <aside className="st-summary h-fit p-6">
        <h2 className="text-lg font-semibold">ההזמנה שלך</h2>
        <ul className="mt-4 space-y-3">
          {valid.map((l) => (
            <li key={l.productId} className="flex items-center gap-3 text-sm">
              <span className="st-thumb size-12 shrink-0 overflow-hidden">
                {l.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(l.image, 'thumb')!} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                {l.name} <span className="st-muted tabular-nums">× {l.quantity}</span>
              </span>
              <span className="tabular-nums">{formatPrice(l.price_agorot * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-[var(--st-line)] pt-4 font-semibold">
          <span>סה״כ</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>
        <p className="st-notice mt-4 p-3 text-sm leading-relaxed">
          <strong>אין תשלום באתר.</strong> {settings.payment_note}
        </p>
        {settings.pickup_address && <p className="st-muted mt-3 text-sm">איסוף מ: {settings.pickup_address}</p>}
        <button type="submit" disabled={pending || submitted || !canOrder} className={cn('st-btn st-btn-primary mt-5 w-full')}>
          {pending ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              שולחים את ההזמנה…
            </>
          ) : (
            'שליחת ההזמנה'
          )}
        </button>
        <p className="st-muted mt-3 text-xs leading-relaxed">הפרטים נשלחים לעסק בלבד כדי לטפל בהזמנה.</p>
      </aside>
    </form>
  )
}

function StoreField({ id, label, hint, error, optional, children }: { id: string; label: string; hint?: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {optional && <span className="st-muted font-normal"> (לא חובה)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="st-muted mt-1.5 text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-[#b42318]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
