import type { Metadata } from 'next'
import { OnboardingProducts } from '@/components/onboarding/onboarding-products'
import { isEnrichmentEnabled } from '@/lib/ai/enrichment'
import { requireMerchant } from '@/lib/auth'
import { loadCatalog } from '@/lib/data/merchant'

export const metadata: Metadata = { title: 'המוצרים שלך' }

export default async function OnboardingProductsPage() {
  const { claims, store } = await requireMerchant('/onboarding/products')
  const { products, categories } = await loadCatalog(claims, store.id)
  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="font-display text-display-sm text-ink sm:text-display">התמונות הופכות למוצרים</h1>
        <p className="mt-3 text-lg text-muted">
          בחרו כמה תמונות בבת אחת. לכל תמונה נפתח כרטיס, ונשאר רק לכתוב שם ומחיר. כמה תמונות של אותו מוצר? מסמנים ומאחדים.
        </p>
      </div>
      <div className="mt-8">
        <OnboardingProducts products={products} categories={categories} aiEnabled={isEnrichmentEnabled()} />
      </div>
    </div>
  )
}
