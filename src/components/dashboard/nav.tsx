'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard, LayoutDashboard, Package, Palette, ReceiptText, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

export const NAV = [
  { href: '/dashboard', label: 'סקירה כללית', short: 'סקירה', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'הזמנות', short: 'הזמנות', icon: ReceiptText },
  { href: '/dashboard/products', label: 'מוצרים', short: 'מוצרים', icon: Package },
  { href: '/dashboard/design', label: 'עיצוב החנות', short: 'עיצוב', icon: Palette },
  { href: '/dashboard/settings', label: 'הגדרות', short: 'הגדרות', icon: Settings },
  { href: '/dashboard/billing', label: 'מסלול ומנוי', short: 'מנוי', icon: CreditCard },
]

function isActive(path: string, href: string) {
  return href === '/dashboard' ? path === href : path === href || path.startsWith(`${href}/`)
}

export function SideNav({ newOrders }: { newOrders: number }) {
  const path = usePathname()
  return (
    <nav aria-label="ניווט ראשי" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] font-medium transition-colors duration-150',
              active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-sunken hover:text-ink',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
            {href === '/dashboard/orders' && newOrders > 0 && (
              <span className={cn('ms-auto rounded-full px-2 text-xs font-bold tabular-nums', active ? 'bg-turmeric text-ink' : 'bg-turmeric text-ink')}>
                {newOrders}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav({ newOrders }: { newOrders: number }) {
  const path = usePathname()
  return (
    <nav aria-label="ניווט ראשי" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {NAV.slice(0, 5).map(({ href, short, icon: Icon }) => {
          const active = isActive(path, href) || (href === '/dashboard/settings' && path.startsWith('/dashboard/billing'))
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined} className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium', active ? 'text-ink' : 'text-muted')}>
                <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', active && 'bg-turmeric-wash')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {short}
                {href === '/dashboard/orders' && newOrders > 0 && (
                  <span className="absolute top-1.5 start-[calc(50%+0.5rem)] grid min-w-5 place-items-center rounded-full bg-turmeric px-1 text-[11px] font-bold text-ink">{newOrders}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
