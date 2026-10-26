import type { Metadata } from 'next'
import Link from 'next/link'
import { DesignEditor } from '@/components/design/design-editor'
import { PageHeader } from '@/components/dashboard/page-header'
import { requireMerchant } from '@/lib/auth'
import { getStorePreview } from '@/lib/data/storefront'

export const metadata: Metadata = { title: 'עיצוב החנות' }

export default async function DesignPage() {
  const { claims, store } = await requireMerchant('/dashboard/design')
  const payload = await getStorePreview(claims, store.id)
  if (!payload) return null
  const sampleImages = payload.products.flatMap((p) => p.images.map((i) => i.path)).slice(0, 3)
  return (
    <>
      <PageHeader
        title="עיצוב החנות"
        description={
          <>
            החלפת סגנון לא משנה מוצרים או הזמנות. את סדר המוצרים והקטגוריות קובעים ב
            <Link href="/dashboard/products" className="font-semibold text-tchelet hover:underline">
              עמוד המוצרים
            </Link>
            .
          </>
        }
      />
      <DesignEditor settings={payload.settings} storeName={store.name} logoPath={store.logo_path} sampleImages={sampleImages} mode="dashboard" />
    </>
  )
}
