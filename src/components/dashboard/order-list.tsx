import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OrderRow } from '@/lib/data/merchant'
import { formatDateTime, formatPrice } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/types'

export function OrderList({ orders }: { orders: OrderRow[] }) {
  return (
    <ul className="divide-y divide-line" data-testid="order-list">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sunken">
            <span className="w-16 shrink-0 font-display text-2xl leading-none tabular-nums text-ink">#{o.order_number}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{o.customer_name}</span>
                <Badge tone={ORDER_STATUS_TONE[o.status]} dot>
                  {ORDER_STATUS_LABEL[o.status]}
                </Badge>
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span>{formatDateTime(o.created_at)}</span>
                <span>{o.item_count === 1 ? 'פריט אחד' : `${o.item_count} פריטים`}</span>
                {o.pickup_at && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    איסוף {formatDateTime(o.pickup_at)}
                  </span>
                )}
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{formatPrice(o.total_agorot)}</span>
            <ChevronLeft className="size-4 shrink-0 text-subtle" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}
