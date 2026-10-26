import type { Metadata } from 'next'
import { PublishedSuccess } from '@/components/onboarding/published-success'
import { requireMerchant } from '@/lib/auth'
import { loadAccountStatus } from '@/lib/data/merchant'
import { serverEnv } from '@/lib/env'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'החנות באוויר' }

export default async function LivePage() {
  const { claims, store } = await requireMerchant('/onboarding/live')
  const account = await loadAccountStatus(claims)
  const url = `${serverEnv.siteUrl}/s/${store.slug}`
  return (
    <PublishedSuccess
      url={url}
      storeName={store.name}
      published={store.status === 'published'}
      trialNote={account?.effective === 'trialing' && account.trial_ends_at ? `תקופת הניסיון פעילה עד ${formatDate(account.trial_ends_at)}.` : null}
    />
  )
}
