'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { updateOrderStatus } from '@/lib/actions/orders'
import { cn } from '@/lib/cn'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'confirmed', label: 'אישור ההזמנה' },
  confirmed: { status: 'preparing', label: 'התחלת הכנה' },
  preparing: { status: 'ready', label: 'סימון כמוכנה לאיסוף' },
  ready: { status: 'completed', label: 'סימון שנאספה' },
}

export function OrderStatusControl({ orderId, status: initial }: { orderId: string; status: OrderStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const change = (next: OrderStatus) =>
    startTransition(async () => {
      setError(null)
      const prev = status
      setStatus(next)
      const res = await updateOrderStatus(orderId, next)
      if (!res.ok) {
        setStatus(prev)
        setError(res.error)
        return
      }
      router.refresh()
    })

  const step = NEXT[status]
  const flow: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== 'canceled')
  const index = flow.indexOf(status)

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-y-2" aria-label="שלבי ההזמנה">
        {flow.map((s, i) => (
          <li key={s} className="flex items-center">
            <span className={cn('flex items-center gap-1.5 text-sm', i <= index && status !== 'canceled' ? 'font-semibold text-ink' : 'text-subtle')}>
              <span className={cn('grid size-5 place-items-center rounded-full', i < index && status !== 'canceled' ? 'bg-olive text-white' : i === index ? 'bg-turmeric text-ink' : 'bg-sunken')}>
                {i < index && status !== 'canceled' && <Check className="size-3" aria-hidden />}
              </span>
              {ORDER_STATUS_LABEL[s]}
            </span>
            {i < flow.length - 1 && <span className="mx-2 h-px w-5 bg-line-strong" aria-hidden />}
          </li>
        ))}
      </ol>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        {step && (
          <Button type="button" onClick={() => change(step.status)} pending={pending}>
            {step.label}
          </Button>
        )}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">או לשנות ל:</span>
          <select
            value={status}
            onChange={(e) => change(e.target.value as OrderStatus)}
            disabled={pending}
            className="h-9 rounded-md border border-line-strong bg-surface px-2 text-sm"
            aria-label="שינוי סטטוס"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
