import Link from 'next/link'
import { Notice } from '@/components/ui/notice'
import { formatDate } from '@/lib/format'
import type { AccountStatus } from '@/lib/types'

/** Server-computed subscription state, shown wherever it affects what the merchant can do. */
export function AccountNotice({ account, compact }: { account: AccountStatus | null; compact?: boolean }) {
  if (!account) return null
  if (account.effective === 'expired')
    return (
      <Notice
        tone="danger"
        title="תקופת הניסיון הסתיימה. החנות לא מקבלת הזמנות חדשות."
        action={
          <Link href="/dashboard/billing" className="inline-flex h-9 items-center rounded-md bg-ink px-3 text-sm font-semibold text-white">
            הפעלת מנוי
          </Link>
        }
      >
        כל המוצרים, ההזמנות והנתונים שמורים. הלקוחות עדיין רואים את החנות, ואפשר לחזור לקבל הזמנות מיד עם הפעלת המנוי.
      </Notice>
    )
  if (account.effective === 'past_due')
    return (
      <Notice tone="warning" title="יש בעיה בתשלום המנוי">
        החנות ממשיכה לקבל הזמנות לזמן קצר. <Link href="/dashboard/billing" className="font-semibold underline">לפרטים</Link>
      </Notice>
    )
  if (account.effective === 'trialing' && !compact && (account.trial_days_left ?? 0) <= 2)
    return (
      <Notice tone="warning" title={`נשארו ${account.trial_days_left} ימים לתקופת הניסיון`}>
        הניסיון מסתיים ב־{formatDate(account.trial_ends_at)}. <Link href="/dashboard/billing" className="font-semibold underline">איך ממשיכים</Link>
      </Notice>
    )
  return null
}
