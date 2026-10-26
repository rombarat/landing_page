import type { Metadata } from 'next'
import { PublishStep } from '@/components/onboarding/publish-step'
import { requireMerchant } from '@/lib/auth'
import { getStorePreview } from '@/lib/data/storefront'

export const metadata: Metadata = { title: 'פרסום' }

export default async function OnboardingPublishPage() {
  const { claims, store } = await requireMerchant('/onboarding/publish')
  const payload = await getStorePreview(claims, store.id)
  if (!payload) return null
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-display-sm text-ink sm:text-display">רגע לפני שפותחים</h1>
      <p className="mt-3 text-lg text-muted">עוד כמה פרטים שהלקוחות צריכים לדעת, ואז החנות באוויר.</p>
      <PublishStep
        storeName={store.name}
        hasContact={Boolean(store.phone || store.whatsapp)}
        activeProducts={payload.products.length}
        settings={payload.settings}
        alreadyPublished={store.status === 'published'}
      />
    </div>
  )
}
