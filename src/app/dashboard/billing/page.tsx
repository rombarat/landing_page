import type { Metadata } from 'next'
import { Check, Mail, MessageCircle } from 'lucide-react'
import { AccountNotice } from '@/components/dashboard/account-notice'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { Notice } from '@/components/ui/notice'
import { Panel } from '@/components/ui/panel'
import { requireMerchant } from '@/lib/auth'
import { getBillingProvider, PLAN } from '@/lib/billing'
import { loadAccountStatus } from '@/lib/data/merchant'
import { formatDate, whatsappLink } from '@/lib/format'

export const metadata: Metadata = { title: 'מסלול ומנוי' }

const EFFECTIVE_LABEL = {
  not_started: { text: 'עוד לא התחיל', tone: 'neutral' },
  trialing: { text: 'תקופת ניסיון', tone: 'brand' },
  active: { text: 'מנוי פעיל', tone: 'success' },
  past_due: { text: 'תשלום בפיגור', tone: 'warning' },
  expired: { text: 'לא פעיל', tone: 'danger' },
} as const

export default async function BillingPage() {
  const { claims, store } = await requireMerchant('/dashboard/billing')
  const account = await loadAccountStatus(claims)
  const provider = getBillingProvider()
  const start = await provider.startSubscription({ userId: claims.sub, email: claims.email })
  const effective = account?.effective ?? 'not_started'
  const label = EFFECTIVE_LABEL[effective]
  const contactText = `שלום, אני רוצה להפעיל מנוי לחנות ${store.name} (${store.slug})`

  return (
    <>
      <PageHeader title="מסלול ומנוי" />
      <div className="max-w-3xl space-y-6">
        <AccountNotice account={account} compact />
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
            <div>
              <p className="text-sm text-muted">המסלול שלך</p>
              <p className="mt-1 font-display text-display-sm leading-none">
                {PLAN.priceIls} ₪ <span className="font-sans text-base text-muted">לחודש</span>
              </p>
            </div>
            <Badge tone={label.tone} dot>
              {label.text}
            </Badge>
          </div>
          <div className="space-y-2 p-6 text-sm">
            {effective === 'not_started' && <p>7 ימי הניסיון מתחילים בפעם הראשונה שמפרסמים את החנות.</p>}
            {effective === 'trialing' && (
              <p>
                נשארו <strong>{account?.trial_days_left} ימים</strong> לתקופת הניסיון, עד {formatDate(account?.trial_ends_at)}. אחריה צריך מנוי כדי להמשיך לקבל הזמנות.
              </p>
            )}
            {effective === 'active' && <p>{account?.current_period_end ? `המנוי פעיל עד ${formatDate(account.current_period_end)}.` : 'המנוי פעיל.'}</p>}
            {effective === 'expired' && <p>החנות לא מקבלת הזמנות חדשות. המוצרים, ההזמנות והנתונים שמורים, ושום דבר לא נמחק.</p>}
            <ul className="mt-4 space-y-1.5 text-ink-soft">
              {['חנות מעוצבת בכתובת משלך', 'מוצרים ותמונות ללא הגבלה מעשית', 'הזמנות לאיסוף עצמי וניהול סטטוסים', 'ביטול בכל זמן'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 text-olive" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        {effective !== 'active' && (
          <Panel className="p-6">
            <h2 className="text-lg font-semibold">הפעלת מנוי</h2>
            <Notice tone="info" className="mt-3">
              תשלום אונליין עוד לא זמין בגרסה הזו. כדי להפעיל מנוי, פנו אלינו ונפעיל אותו ידנית אחרי תיאום התשלום. שום חיוב לא מתבצע מהעמוד הזה.
            </Notice>
            {start.kind === 'contact' && (
              <div className="mt-4 flex flex-wrap gap-3">
                {start.whatsapp && (
                  <a href={whatsappLink(start.whatsapp, contactText)!} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md bg-turmeric px-5 font-semibold text-ink shadow-press hover:bg-turmeric-deep">
                    <MessageCircle className="size-5" aria-hidden />
                    פנייה בוואטסאפ
                  </a>
                )}
                {start.email && (
                  <a href={`mailto:${start.email}?subject=${encodeURIComponent('הפעלת מנוי דוכן')}&body=${encodeURIComponent(contactText)}`} className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-5 font-semibold hover:border-ink">
                    <Mail className="size-5" aria-hidden />
                    פנייה במייל
                  </a>
                )}
                {!start.whatsapp && !start.email && <p className="text-sm text-muted">פרטי יצירת הקשר עם הפלטפורמה עוד לא הוגדרו.</p>}
              </div>
            )}
          </Panel>
        )}
      </div>
    </>
  )
}
