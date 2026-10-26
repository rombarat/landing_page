import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandMark } from '@/components/brand'
import { AdminActions, CleanupButton } from '@/components/admin/admin-actions'
import { Badge } from '@/components/ui/badge'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { requirePlatformAdmin } from '@/lib/auth'
import { asService } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'ניהול הפלטפורמה', robots: { index: false } }
export const dynamic = 'force-dynamic'

type MerchantRow = {
  user_id: string
  email: string
  signed_up_at: Date
  last_sign_in_at: Date | null
  store_id: string | null
  store_name: string | null
  slug: string | null
  store_status: string | null
  suspended_at: Date | null
  suspended_reason: string | null
  published_at: Date | null
  subscription_status: string | null
  effective_status: string | null
  trial_ends_at: Date | null
  current_period_end: Date | null
  product_count: number | null
  order_count: number | null
  last_order_at: Date | null
  image_bytes: bigint | number | null
}

const EFFECTIVE: Record<string, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  not_started: { label: 'לא התחיל', tone: 'neutral' },
  trialing: { label: 'ניסיון', tone: 'brand' },
  active: { label: 'פעיל', tone: 'success' },
  past_due: { label: 'בפיגור', tone: 'warning' },
  expired: { label: 'לא פעיל', tone: 'danger' },
}

export default async function PlatformAdminPage() {
  await requirePlatformAdmin()
  const { merchants, totals, audit } = await asService(async (tx) => {
    const merchants = (await tx<MerchantRow[]>`select * from public.admin_merchants()`) as MerchantRow[]
    const [totals] = await tx<{ orders_7d: number; orders_total: number; products: number }[]>`
      select (select count(*)::int from public.orders where created_at > now() - interval '7 days') as orders_7d,
             (select count(*)::int from public.orders) as orders_total,
             (select count(*)::int from public.products where status <> 'archived') as products`
    const audit = await tx<{ id: number; action: string; created_at: Date; details: Record<string, unknown> }[]>`
      select id, action, created_at, details from public.audit_logs order by created_at desc limit 15`
    return { merchants: [...merchants], totals: totals!, audit: [...audit] }
  })
  const stores = merchants.filter((m) => m.store_id)
  const published = stores.filter((m) => m.store_status === 'published' && !m.suspended_at).length
  const storageMb = merchants.reduce((n, m) => n + Number(m.image_bytes ?? 0), 0) / 1024 / 1024

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-ink text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <BrandMark tone="light" />
          <span className="text-sm text-white/70">ניהול הפלטפורמה</span>
          <Link href="/dashboard" className="ms-auto text-sm text-white/80 hover:text-white">
            לדשבורד
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-6">
          {[
            ['משתמשים', merchants.length],
            ['חנויות', stores.length],
            ['באוויר', published],
            ['מוצרים', totals.products],
            ['הזמנות (7 ימים)', totals.orders_7d],
            ['נפח תמונות', `${storageMb.toFixed(1)}MB`],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-surface p-4">
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-1 font-display text-4xl leading-none tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <Panel>
          <PanelHeader title="סוחרים" description="הפעלה ידנית של מנוי היא הדרך היחידה לסמן חשבון כמשלם בגרסה הזו." action={<CleanupButton />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-line bg-sunken text-start text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">חשבון</th>
                  <th className="px-4 py-2.5 text-start font-semibold">חנות</th>
                  <th className="px-4 py-2.5 text-start font-semibold">מנוי</th>
                  <th className="px-4 py-2.5 text-start font-semibold">מוצרים</th>
                  <th className="px-4 py-2.5 text-start font-semibold">הזמנות</th>
                  <th className="px-4 py-2.5 text-start font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {merchants.map((m) => {
                  const eff = EFFECTIVE[m.effective_status ?? 'not_started'] ?? EFFECTIVE.not_started!
                  return (
                    <tr key={m.user_id} className="align-top" data-testid="admin-merchant-row">
                      <td className="px-4 py-3">
                        <p className="ltr text-start font-medium">{m.email}</p>
                        <p className="text-xs text-muted">נרשם {formatDate(m.signed_up_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {m.store_id ? (
                          <>
                            <p className="font-medium">{m.store_name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {m.suspended_at ? (
                                <Badge tone="danger">מושעית</Badge>
                              ) : (
                                <Badge tone={m.store_status === 'published' ? 'success' : 'neutral'}>{m.store_status === 'published' ? 'באוויר' : m.store_status === 'draft' ? 'טיוטה' : 'מוסתרת'}</Badge>
                              )}
                              {m.store_status === 'published' && (
                                <a href={`/s/${m.slug}`} target="_blank" rel="noopener noreferrer" className="ltr text-xs text-tchelet hover:underline">
                                  /s/{m.slug}
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">אין חנות עדיין</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={eff.tone}>{eff.label}</Badge>
                        <p className="mt-1 text-xs text-muted">
                          {m.effective_status === 'trialing' && m.trial_ends_at && `עד ${formatDate(m.trial_ends_at)}`}
                          {m.effective_status === 'active' && (m.current_period_end ? `עד ${formatDate(m.current_period_end)}` : 'ללא תאריך סיום')}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{m.product_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="tabular-nums">{m.order_count ?? 0}</span>
                        {m.last_order_at && <p className="text-xs text-muted">אחרונה {formatDateTime(m.last_order_at)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <AdminActions userId={m.user_id} storeId={m.store_id} suspended={Boolean(m.suspended_at)} effective={m.effective_status ?? 'not_started'} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="יומן פעולות" description="פעולות ניהול אחרונות" />
          {audit.length === 0 ? (
            <p className="p-5 text-sm text-muted">אין עדיין פעולות.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-x-4 px-5 py-2.5">
                  <span className="text-muted">{formatDateTime(a.created_at)}</span>
                  <span className="ltr font-medium">{a.action}</span>
                  <span className="ltr text-muted">{JSON.stringify(a.details)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </main>
    </div>
  )
}
