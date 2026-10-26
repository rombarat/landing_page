import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-soft',
  info: 'bg-tchelet-wash text-tchelet-deep',
  success: 'bg-olive-wash text-olive',
  warning: 'bg-amber-wash text-amber',
  danger: 'bg-pomegranate-wash text-pomegranate',
  brand: 'bg-turmeric-wash text-ink',
}

export function Badge({ tone = 'neutral', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
