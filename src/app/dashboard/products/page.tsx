import type { Metadata } from 'next'
import { ArchivedProducts, CategoryManager } from '@/components/dashboard/catalog-tools'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProductEditor } from '@/components/products/product-editor'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { isEnrichmentEnabled } from '@/lib/ai/enrichment'
import { requireMerchant } from '@/lib/auth'
import { loadCatalog } from '@/lib/data/merchant'

export const metadata: Metadata = { title: 'מוצרים' }

export default async function ProductsPage() {
  const { claims, store } = await requireMerchant('/dashboard/products')
  const { products, categories } = await loadCatalog(claims, store.id, { includeArchived: true })
  const active = products.filter((p) => p.status !== 'archived')
  const archived = products.filter((p) => p.status === 'archived')
  return (
    <>
      <PageHeader title="מוצרים" description="כל שינוי נשמר ומתעדכן בחנות מיד. סמנו כמה מוצרים כדי לערוך אותם יחד." />
      <ProductEditor key={active.map((p) => p.id).join()} initialProducts={active} initialCategories={categories} mode="dashboard" aiEnabled={isEnrichmentEnabled()} />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="קטגוריות" description="הסדר כאן הוא הסדר בחנות. קטגוריה בלי מוצרים מוצגים לא מופיעה ללקוחות." />
          <CategoryManager categories={categories} />
        </Panel>
        <Panel>
          <PanelHeader title="ארכיון" description="מוצרים שהוצאו מהחנות בלי למחוק אותם." />
          <ArchivedProducts products={archived} />
        </Panel>
      </div>
    </>
  )
}
