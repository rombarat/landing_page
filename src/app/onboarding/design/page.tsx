import type { Metadata } from 'next'
import { DesignEditor } from '@/components/design/design-editor'
import { LinkButton } from '@/components/ui/button'
import { requireMerchant } from '@/lib/auth'
import { getStorePreview } from '@/lib/data/storefront'

export const metadata: Metadata = { title: 'העיצוב' }

export default async function OnboardingDesignPage() {
  const { claims, store } = await requireMerchant('/onboarding/design')
  const payload = await getStorePreview(claims, store.id)
  const sampleImages = (payload?.products ?? []).flatMap((p) => p.images.map((i) => i.path)).slice(0, 3)
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-display-sm text-ink sm:text-display">זו כבר החנות שלך</h1>
          <p className="mt-3 text-lg text-muted">בנינו אותה מהמוצרים שהעלית. בחרו סגנון וצבעים, והתצוגה מתעדכנת מיד.</p>
        </div>
        <LinkButton href="/onboarding/publish" size="lg">
          נראה טוב, להמשיך
        </LinkButton>
      </div>
      {payload && <DesignEditor settings={payload.settings} storeName={store.name} logoPath={store.logo_path} sampleImages={sampleImages} mode="onboarding" />}
      <div className="mt-10 flex justify-between border-t border-line pt-6">
        <LinkButton href="/onboarding/products" variant="ghost">
          חזרה למוצרים
        </LinkButton>
        <LinkButton href="/onboarding/publish" size="lg">
          נראה טוב, להמשיך
        </LinkButton>
      </div>
    </div>
  )
}
