import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, AtSign, Clock, MessageCircle, Phone, StickyNote } from 'lucide-react'
import { OrderStatusControl } from '@/components/dashboard/order-status-control'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { requireMerchant } from '@/lib/auth'
import { loadOrder } from '@/lib/data/merchant'
import { formatDateTime, formatPhone, formatPrice, whatsappLink } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/types'

export const metadata: Metadata = { title: 'פרטי הזמנה' }

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound()
  const { claims, store } = await requireMerchant('/dashboard/orders')
  const data = await loadOrder(claims, store.id, orderId)
  if (!data) notFound()
  const { order, items } = data
  const firstName = order.customer_name.split(' ')[0]
  const waMessages = {
    confirmed: `היי ${firstName}, ההזמנה שלך (#${order.order_number}) מ${store.name} אושרה.`,
    ready: `היי ${firstName}, ההזמנה שלך (#${order.order_number}) מ${store.name} מוכנה לאיסוף.`,
    generic: `היי ${firstName}, לגבי ההזמנה שלך (#${order.order_number}) מ${store.name}:`,
  }
  const waText = order.status === 'ready' ? waMessages.ready : order.status === 'confirmed' ? waMessages.confirmed : waMessages.generic
  const wa = whatsappLink(order.customer_phone, waText)

  return (
    <>
      <Link href="/dashboard/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowRight className="size-4" aria-hidden />
        כל ההזמנות
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-display-sm leading-none tabular-nums">הזמנה #{order.order_number}</h1>
        <Badge tone={ORDER_STATUS_TONE[order.status]} dot>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
        <span className="text-sm text-muted">התקבלה {formatDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="סטטוס" description="הלקוח לא מקבל הודעה אוטומטית על שינוי סטטוס. אפשר לעדכן אותו בוואטסאפ." />
            <div className="p-5">
              <OrderStatusControl orderId={order.id} status={order.status} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="מה הוזמן" />
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sunken font-semibold tabular-nums">{i.quantity}×</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{i.product_name}</span>
                    <span className="text-sm text-muted tabular-nums">{formatPrice(i.unit_price_agorot)} ליחידה</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(i.line_total_agorot)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-line px-5 py-4 text-lg font-semibold">
              <span>סה״כ</span>
              <span className="tabular-nums">{formatPrice(order.total_agorot)}</span>
            </div>
            <p className="border-t border-line px-5 py-3 text-sm text-muted">התשלום לא נגבה באתר. גובים ישירות מהלקוח.</p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="הלקוח" />
            <div className="space-y-3 p-5">
              <p className="text-lg font-semibold">{order.customer_name}</p>
              <a href={`tel:${order.customer_phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-tchelet hover:underline">
                <Phone className="size-4" aria-hidden />
                <span className="ltr">{formatPhone(order.customer_phone)}</span>
              </a>
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-tchelet hover:underline">
                  <AtSign className="size-4" aria-hidden />
                  <span className="ltr">{order.customer_email}</span>
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-[#1f7a4d] px-4 text-sm font-semibold text-white hover:bg-[#186640]">
                  <MessageCircle className="size-4" aria-hidden />
                  פתיחת שיחה בוואטסאפ
                </a>
              )}
              <p className="text-xs text-muted">ההודעה נפתחת בוואטסאפ שלכם עם טקסט מוכן. שום הודעה לא נשלחת בלי שתלחצו שליחה.</p>
            </div>
          </Panel>
          {order.pickup_at && (
            <Panel className="flex items-start gap-3 p-5">
              <Clock className="mt-0.5 size-5 text-muted" aria-hidden />
              <div>
                <p className="font-semibold">מועד איסוף מבוקש</p>
                <p className="text-muted">{formatDateTime(order.pickup_at)}</p>
              </div>
            </Panel>
          )}
          {order.notes && (
            <Panel className="flex items-start gap-3 p-5">
              <StickyNote className="mt-0.5 size-5 text-muted" aria-hidden />
              <div>
                <p className="font-semibold">הערות הלקוח</p>
                <p className="mt-1 whitespace-pre-line">{order.notes}</p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}
