import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { BrandMark } from '@/components/brand'
import { AutoRefresh } from '@/components/dashboard/auto-refresh'
import { BottomNav, SideNav } from '@/components/dashboard/nav'
import { Badge } from '@/components/ui/badge'
import { isPlatformAdmin, requireMerchant } from '@/lib/auth'
import { asUser } from '@/lib/db'
import { loadAccountStatus } from '@/lib/data/merchant'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { claims, store } = await requireMerchant('/dashboard')
  const [account, admin, [counts]] = await Promise.all([
    loadAccountStatus(claims),
    isPlatformAdmin(claims),
    asUser(claims, (tx) => tx<{ new_orders: number }[]>`select count(*)::int as new_orders from public.orders where store_id = ${store.id} and status = 'new'`),
  ])
  const newOrders = counts?.new_orders ?? 0
  const live = store.status === 'published' && !store.suspended_at

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AutoRefresh />
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-surface px-4 py-5 lg:flex">
        <BrandMark className="px-2" />
        <div className="mt-6 rounded-md bg-sunken px-3 py-3">
          <p className="truncate font-semibold">{store.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge tone={live ? 'success' : store.suspended_at ? 'danger' : 'neutral'} dot>
              {store.suspended_at ? 'מושעית' : live ? 'באוויר' : store.status === 'draft' ? 'טיוטה' : 'מוסתרת'}
            </Badge>
            {account?.effective === 'trialing' && <Badge tone="brand">{account.trial_days_left} ימי ניסיון</Badge>}
          </div>
        </div>
        <div className="mt-5 flex-1">
          <SideNav newOrders={newOrders} />
        </div>
        <div className="space-y-1 border-t border-line pt-4 text-sm">
          {live && (
            <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-3 py-2 text-ink-soft hover:bg-sunken">
              <ExternalLink className="size-4" aria-hidden />
              צפייה בחנות
            </a>
          )}
          {admin && (
            <Link href="/platform-admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-ink-soft hover:bg-sunken">
              ניהול הפלטפורמה
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-ink-soft hover:bg-sunken">
              <LogOut className="size-4" aria-hidden />
              התנתקות
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
          <BrandMark />
          <span className="min-w-0 truncate text-sm font-semibold text-muted">{store.name}</span>
          <div className="ms-auto flex items-center gap-1">
            {live && (
              <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-md hover:bg-sunken" aria-label="צפייה בחנות">
                <ExternalLink className="size-5" aria-hidden />
              </a>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" className="grid size-10 place-items-center rounded-md hover:bg-sunken" aria-label="התנתקות">
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>
      <BottomNav newOrders={newOrders} />
    </div>
  )
}
