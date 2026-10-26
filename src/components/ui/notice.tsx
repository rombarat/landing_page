import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const styles = {
  info: { box: 'border-tchelet/25 bg-tchelet-wash text-tchelet-deep', Icon: Info },
  success: { box: 'border-olive/25 bg-olive-wash text-olive', Icon: CheckCircle2 },
  warning: { box: 'border-amber/25 bg-amber-wash text-amber', Icon: AlertTriangle },
  danger: { box: 'border-pomegranate/25 bg-pomegranate-wash text-pomegranate', Icon: XCircle },
}

export function Notice({ tone = 'info', title, children, action, className }: { tone?: keyof typeof styles; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const { box, Icon } = styles[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? 'mt-0.5' : null, 'text-ink-soft')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}
