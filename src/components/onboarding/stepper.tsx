'use client'

import { Check } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const STEPS = [
  { href: '/onboarding', label: 'העסק' },
  { href: '/onboarding/products', label: 'המוצרים' },
  { href: '/onboarding/design', label: 'העיצוב' },
  { href: '/onboarding/publish', label: 'פרסום' },
]

export function Stepper() {
  const path = usePathname()
  const current = Math.max(0, STEPS.findLastIndex((s) => path === s.href || path.startsWith(`${s.href}/`)))
  if (path.startsWith('/onboarding/live')) return null
  return (
    <ol className="flex items-center gap-1.5 sm:gap-3" aria-label="שלבי הקמת החנות">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={step.href} className="flex items-center gap-1.5 sm:gap-3" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold',
                done && 'bg-ink text-white',
                active && 'bg-turmeric text-ink',
                !done && !active && 'bg-sunken text-muted',
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn('hidden text-sm font-medium sm:inline', active ? 'text-ink' : 'text-muted')}>{step.label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-line-strong sm:w-8" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}
