'use client'

import { useState, useTransition } from 'react'
import {
  adminActivateSubscription,
  adminCleanupOrphans,
  adminDeactivateSubscription,
  adminExpireTrial,
  adminExtendTrial,
  adminSetSuspended,
} from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'

export function AdminActions({ userId, storeId, suspended, effective }: { userId: string; storeId: string | null; suspended: boolean; effective: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      const res = await fn()
      setMessage(res.ok ? done : (res.error ?? 'נכשל'))
    })
  return (
    <div className="flex max-w-xs flex-wrap gap-1.5">
      {effective !== 'active' ? (
        <Button size="sm" variant="ink" disabled={pending} onClick={() => run(() => adminActivateSubscription(userId, 1), 'הופעל לחודש')}>
          הפעלת מנוי לחודש
        </Button>
      ) : (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => adminActivateSubscription(userId, 1), 'הוארך בחודש')}>
            +חודש
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => adminDeactivateSubscription(userId), 'בוטל')}>
            ביטול מנוי
          </Button>
        </>
      )}
      {effective !== 'active' && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => adminExtendTrial(userId, 7), 'הניסיון הוארך')}>
          +7 ימי ניסיון
        </Button>
      )}
      {effective === 'trialing' && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => adminExpireTrial(userId), 'הניסיון הסתיים')}>
          סיום ניסיון (בדיקות)
        </Button>
      )}
      {storeId &&
        (suspended ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => adminSetSuspended(storeId, false, ''), 'ההשעיה בוטלה')}>
            ביטול השעיה
          </Button>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              const reason = window.prompt('סיבת ההשעיה (תוצג לסוחר):') ?? null
              if (reason !== null) run(() => adminSetSuspended(storeId, true, reason), 'החנות הושעתה')
            }}
          >
            השעיה
          </Button>
        ))}
      {message && (
        <p className="w-full text-xs text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  )
}

export function CleanupButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-xs text-muted">{message}</span>}
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await adminCleanupOrphans()
            setMessage(res.ok ? `נמחקו ${res.data?.removed ?? 0} קבצים יתומים` : res.error)
          })
        }
      >
        ניקוי קבצים יתומים
      </Button>
    </div>
  )
}
