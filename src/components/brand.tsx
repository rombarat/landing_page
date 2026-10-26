import Link from 'next/link'
import { cn } from '@/lib/cn'

export function BrandMark({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'light' }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2', className)} aria-label="דוכן — לעמוד הבית">
      <svg viewBox="0 0 40 24" className="h-6 w-10 shrink-0" aria-hidden>
        <path d="M0 0h28l12 12-12 12H0z" fill="#f4b400" />
        <circle cx="30" cy="12" r="3" fill={tone === 'ink' ? '#fbfbf9' : '#1b1f3b'} />
      </svg>
      <span className={cn('font-display text-[2.1rem] leading-none font-bold', tone === 'ink' ? 'text-ink' : 'text-white')}>דוכן</span>
    </Link>
  )
}
