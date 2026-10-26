import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, PackagePlus } from 'lucide-react'
import { AccountNotice } from '@/components/dashboard/account-notice'
import { OrderList } from '@/components/dashboard/order-list'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { requireMerchant } from '@/lib/auth'
import { loadAccountStatus, loadOrders, loadOverview } from '@/lib/data/merchant'
import { serverEnv } from '@/lib/env'
import { formatDate, formatPrice } from '@/lib/format'

export const metadata: Metadata = { title: 'סקירה כללית' }

export default async function DashboardHome() {
  const { claims, store } = await requireMerchant()
  const [stats, recent, account] = await Promise.all([loadOverview(claims, store.id), loadOrders(claims, store.id, undefined, 5), loadAccountStatus(claims)])
  const live = store.status === 'published' && !store.suspended_at
  const url = `${serverEnv.siteUrl}/s/${store.slug}`

  return (
    <>
      <PageHeader title={`שלום, ${store.name}`} description={live ? 'כך נראים העניינים בחנות.' : 'החנות עדיין לא פורסמה.'} />
      <div className="space-y-6">
        <AccountNotice account={account} />
        {store.suspended_at && (
          <Panel className="border-pomegranate/30 bg-pomegranate-wash p-5">
            <p className="font-semibold text-pomegranate">החנות הושעתה על ידי צוות דוכן</p>
            {store.suspended_reason && <p className="mt-1 text-sm">{store.suspended_reason}</p>}
          </Panel>
        )}

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
          <Stat label="הזמנות חדשות" value={stats.new_count} href="/dashboard/orders?status=new" highlight={stats.new_count > 0} />
          <Stat label="ממתינות לטיפול" value={stats.open_count} href="/dashboard/orders" hint="חדשות, מאושרות, בהכנה ומוכנות" />
          <Stat label="כל ההזמנות" value={stats.total} href="/dashboard/orders?status=all" />
          <Stat label="שווי ההזמנות" value={formatPrice(stats.order_value)} hint="סכום ההזמנות שהתקבלו, בלי מבוטלות. לא תשלומים שנגבו." />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="הזמנות אחרונות"
              action={
                stats.total > 0 && (
                  <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-tchelet hover:underline">
                    לכל ההזמנות
                    <ArrowLeft className="size-4" aria-hidden />
                  </Link>
                )
              }
            />
            {recent.length > 0 ? (
              <OrderList orders={[...recent]} />
            ) : (
              <EmptyState title="עוד אין הזמנות" action={live ? <CopyHint url={url} /> : undefined}>
                {live ? 'שתפו את הקישור לחנות בוואטסאפ ובאינסטגרם, וההזמנות יופיעו כאן.' : 'אחרי שתפרסמו את החנות, הזמנות יופיעו כאן.'}
              </EmptyState>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel className="p-5">
              <h2 className="text-lg font-semibold">החנות</h2>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={live ? 'success' : 'neutral'} dot>
                  {live ? 'באוויר' : store.status === 'draft' ? 'טיוטה' : 'מוסתרת'}
                </Badge>
                {!store.accepting_orders && <Badge tone="warning">הזמנות מושהות</Badge>}
              </div>
              <p className="ltr mt-3 truncate text-start text-sm text-tchelet-deep">{url}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {live ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-3 text-sm font-semibold hover:border-ink">
                    <ExternalLink className="size-4" aria-hidden />
                    פתיחה
                  </a>
                ) : (
                  <LinkButton href="/onboarding/publish" size="sm">
                    לפרסום החנות
                  </LinkButton>
                )}
                <LinkButton href="/dashboard/design" variant="outline" size="sm">
                  עריכת העיצוב
                </LinkButton>
              </div>
            </Panel>

            <Panel className="p-5">
              <h2 className="text-lg font-semibold">מוצרים</h2>
              <p className="mt-2 text-sm text-muted">
                {stats.products_active} מוצגים בחנות מתוך {stats.products_total}
              </p>
              {stats.products_total > stats.products_active && (
                <p className="mt-1 text-sm text-amber">חלק מהמוצרים מוסתרים או חסר להם שם או מחיר.</p>
              )}
              <LinkButton href="/dashboard/products" variant="outline" size="sm" className="mt-4" icon={<PackagePlus className="size-4" aria-hidden />}>
                הוספה ועריכה
              </LinkButton>
            </Panel>

            <Panel className="p-5">
              <h2 className="text-lg font-semibold">מסלול</h2>
              <p className="mt-2 text-sm text-muted">
                {account?.effective === 'trialing'
                  ? `תקופת ניסיון: נשארו ${account.trial_days_left} ימים (עד ${formatDate(account.trial_ends_at)}).`
                  : account?.effective === 'active'
                    ? 'מנוי פעיל.'
                    : account?.effective === 'not_started'
                      ? '7 ימי ניסיון מתחילים כשמפרסמים את החנות.'
                      : 'אין מנוי פעיל.'}
              </p>
              <Link href="/dashboard/billing" className="mt-3 inline-block text-sm font-semibold text-tchelet hover:underline">
                פרטי המסלול
              </Link>
            </Panel>
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, href, hint, highlight }: { label: string; value: number | string; href?: string; hint?: string; highlight?: boolean }) {
  const body = (
    <>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 font-display text-[2.75rem] leading-none text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </>
  )
  const cls = `block bg-surface p-5 ${highlight ? 'bg-turmeric-wash' : ''}`
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:bg-sunken`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

function CopyHint({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-tchelet hover:underline">
      פתיחת החנות
    </a>
  )
}
