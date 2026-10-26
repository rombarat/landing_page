import type { Metadata } from 'next'
import Link from 'next/link'
import { ReceiptText } from 'lucide-react'
import { AccountNotice } from '@/components/dashboard/account-notice'
import { OrderList } from '@/components/dashboard/order-list'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { requireMerchant } from '@/lib/auth'
import { cn } from '@/lib/cn'
import { loadAccountStatus, loadOrders } from '@/lib/data/merchant'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'הזמנות' }

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'open', label: 'לטיפול' },
  ...ORDER_STATUSES.map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s] })),
  { key: 'all', label: 'הכול' },
]

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams
  const status = FILTERS.some((f) => f.key === raw) ? raw! : 'open'
  const { claims, store } = await requireMerchant('/dashboard/orders')
  const [orders, account] = await Promise.all([
    loadOrders(claims, store.id, status === 'all' ? undefined : (status as OrderStatus | 'open')),
    loadAccountStatus(claims),
  ])
  return (
    <>
      <PageHeader title="הזמנות" description="הזמנות חדשות מופיעות כאן אוטומטית. הדף מתרענן כל חצי דקה." />
      <div className="space-y-5">
        <AccountNotice account={account} compact />
        <nav aria-label="סינון לפי סטטוס" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-1.5">
            {FILTERS.map((f) => (
              <li key={f.key}>
                <Link
                  href={`/dashboard/orders?status=${f.key}`}
                  aria-current={status === f.key ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors',
                    status === f.key ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface hover:border-ink',
                  )}
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Panel>
          {orders.length > 0 ? (
            <OrderList orders={[...orders]} />
          ) : (
            <EmptyState icon={<ReceiptText className="size-6" />} title={status === 'open' ? 'אין הזמנות שמחכות לטיפול' : 'אין הזמנות כאן'}>
              {status === 'open' ? 'כל ההזמנות טופלו. הזמנות חדשות יופיעו כאן.' : 'נסו סינון אחר.'}
            </EmptyState>
          )}
        </Panel>
      </div>
    </>
  )
}
