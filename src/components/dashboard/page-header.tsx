import type { ReactNode } from 'react'

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-display-sm leading-none text-ink">{title}</h1>
        {description && <p className="mt-2 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
