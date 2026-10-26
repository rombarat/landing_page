import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { asAnon } from '@/lib/db'
import { formatDateTime, formatPrice, whatsappLink } from '@/lib/format'

export const metadata: Metadata = { title: 'ההזמנה התקבלה', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Confirmation = {
  order_number: number
  created_at: string
  pickup_at: string | null
  total_agorot: number
  customer_first_name: string
  store: { slug: string; name: string; phone: string | null; whatsapp: string | null }
  pickup_address: string
  pickup_instructions: string
  payment_note: string
  items: Array<{ name: string; quantity: number; line_total_agorot: number }>
}

export default async function OrderSuccessPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ slug }, { t }] = await Promise.all([params, searchParams])
  if (!t || !/^[0-9a-f-]{36}$/i.test(t)) notFound()
  const [row] = await asAnon((tx) => tx`select public.order_confirmation(${t}) as c`)
  const c = row?.c as Confirmation | null
  if (!c || c.store.slug !== slug.toLowerCase()) notFound()
  const wa = whatsappLink(c.store.whatsapp, `שלום, שלחתי הזמנה מספר ${c.order_number} באתר`)

  return (
    <div className="mx-auto max-w-2xl px-4 pt-12 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-[var(--st-primary)]" aria-hidden />
        <h1 className="st-display mt-4 text-[clamp(2rem,6vw,3rem)] leading-tight">תודה {c.customer_first_name}, ההזמנה נשלחה</h1>
        <p className="mt-3 text-lg">
          מספר הזמנה <strong className="tabular-nums">#{c.order_number}</strong>
        </p>
        <p className="st-muted mt-2">{c.store.name} יחזרו אליכם לאישור ותיאום האיסוף.</p>
      </div>

      <div className="st-summary mt-10 p-6">
        <ul className="space-y-2 text-sm">
          {c.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-4">
              <span>
                {i.name} <span className="st-muted tabular-nums">× {i.quantity}</span>
              </span>
              <span className="tabular-nums">{formatPrice(i.line_total_agorot)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-[var(--st-line)] pt-4 font-semibold">
          <span>סה״כ לתשלום בעת האיסוף</span>
          <span className="tabular-nums">{formatPrice(c.total_agorot)}</span>
        </div>
        <p className="st-notice mt-4 p-3 text-sm leading-relaxed">
          <strong>לא בוצע תשלום באתר.</strong> {c.payment_note}
        </p>
        {c.pickup_at && <p className="mt-4 text-sm">מועד איסוף מבוקש: {formatDateTime(c.pickup_at)} (ממתין לאישור העסק)</p>}
        {c.pickup_address && <p className="mt-2 text-sm">כתובת לאיסוף: {c.pickup_address}</p>}
        {c.pickup_instructions && <p className="st-muted mt-2 whitespace-pre-line text-sm">{c.pickup_instructions}</p>}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-primary">
            <MessageCircle className="size-5" aria-hidden />
            הודעה לעסק בוואטסאפ
          </a>
        )}
        <Link href={`/s/${c.store.slug}`} className="st-btn st-btn-outline">
          חזרה לחנות
        </Link>
      </div>
    </div>
  )
}
