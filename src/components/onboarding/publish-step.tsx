'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { publishStore, updatePickup } from '@/lib/actions/store'
import { cn } from '@/lib/cn'
import type { StoreSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'

export function PublishStep({ storeName, hasContact, activeProducts, settings, alreadyPublished }: { storeName: string; hasContact: boolean; activeProducts: number; settings: StoreSettings; alreadyPublished: boolean }) {
  const router = useRouter()
  const [address, setAddress] = useState(settings.pickup_address)
  const [instructions, setInstructions] = useState(settings.pickup_instructions)
  const [requiresSlot, setRequiresSlot] = useState(settings.pickup_requires_slot)
  const [leadHours, setLeadHours] = useState(settings.pickup_lead_hours)
  const [paymentNote, setPaymentNote] = useState(settings.payment_note)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const checks = [
    { ok: storeName.trim().length > 0, label: 'שם לחנות' },
    { ok: hasContact, label: 'טלפון או וואטסאפ ליצירת קשר', fix: '/dashboard/settings' },
    { ok: activeProducts > 0, label: activeProducts > 0 ? `${activeProducts} מוצרים עם שם ומחיר` : 'לפחות מוצר אחד עם שם ומחיר', fix: '/onboarding/products' },
  ]
  const ready = checks.every((c) => c.ok)

  const publish = () =>
    startTransition(async () => {
      setError(null)
      const saved = await updatePickup({
        pickup_address: address,
        pickup_instructions: instructions,
        pickup_requires_slot: requiresSlot,
        pickup_lead_hours: leadHours,
        payment_note: paymentNote,
      })
      if (!saved.ok) return setError(saved.error)
      const res = await publishStore()
      if (!res.ok) return setError(res.error)
      router.push('/onboarding/live')
    })

  return (
    <div className="mt-8 space-y-8">
      <ul className="space-y-2 rounded-lg border border-line bg-surface p-5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-3">
            {c.ok ? <CheckCircle2 className="size-5 text-olive" aria-hidden /> : <Circle className="size-5 text-line-strong" aria-hidden />}
            <span className={cn(!c.ok && 'text-muted')}>{c.label}</span>
            {!c.ok && c.fix && (
              <Link href={c.fix} className="ms-auto text-sm font-semibold text-tchelet hover:underline">
                להשלמה
              </Link>
            )}
          </li>
        ))}
      </ul>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">איסוף ותשלום</h2>
        <Field label="כתובת לאיסוף" optional hint="אפשר רק עיר או שכונה, ולשלוח כתובת מדויקת לאחר אישור ההזמנה">
          {(p) => <Input {...p} value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} placeholder="למשל: רעננה, שכונת לב הפארק" />}
        </Field>
        <Field label="הנחיות לאיסוף" optional>
          {(p) => <Textarea {...p} value={instructions} maxLength={600} onChange={(e) => setInstructions(e.target.value)} placeholder="למשל: איסוף בימים א׳–ה׳ בין 16:00 ל־20:00. לצלצל באינטרקום 4." />}
        </Field>
        <Checkbox checked={requiresSlot} onChange={(e) => setRequiresSlot(e.target.checked)} label="לבקש מהלקוחות לבחור מועד איסוף" hint="הלקוח בוחר תאריך ושעה, ואתם מאשרים" />
        <Field label="כמה זמן מראש צריך להזמין?" hint="0 אם אפשר לאסוף מיד">
          {(p) => (
            <div className="flex items-center gap-2">
              <Input {...p} type="number" min={0} max={336} value={leadHours} onChange={(e) => setLeadHours(Math.max(0, Math.min(336, Number(e.target.value) || 0)))} className="w-28" />
              <span className="text-muted">שעות</span>
            </div>
          )}
        </Field>
        <Field label="איך משלמים?" hint="יוצג ללקוחות בעגלה ובאישור ההזמנה. אין סליקה באתר.">
          {(p) => <Textarea {...p} value={paymentNote} maxLength={300} onChange={(e) => setPaymentNote(e.target.value)} />}
        </Field>
      </section>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="rounded-lg bg-ink p-6 text-white">
        <p className="text-lg font-semibold">{alreadyPublished ? 'החנות כבר באוויר' : '7 ימי ניסיון בחינם מתחילים עם הפרסום'}</p>
        <p className="mt-1 text-sm text-white/75">
          {alreadyPublished ? 'שמירה תעדכן את פרטי האיסוף בחנות.' : 'אחר כך 99 ₪ לחודש כדי להמשיך לקבל הזמנות. בלי כרטיס אשראי עכשיו, וכל הנתונים נשמרים גם אם לא ממשיכים.'}
        </p>
        <Button type="button" size="lg" className="mt-5 w-full sm:w-auto" onClick={publish} pending={pending} disabled={!ready}>
          {alreadyPublished ? 'שמירה' : 'פרסום החנות שלי'}
        </Button>
      </div>
    </div>
  )
}
