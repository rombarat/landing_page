import type { StorePayload } from '@/lib/types'
import { ProductGrid } from './product-card'
import { CategoryNav } from './store-home'

export function StoreCatalog({ payload, basePath, categoryId }: { payload: StorePayload; basePath: string; categoryId?: string | null }) {
  const category = payload.categories.find((c) => c.id === categoryId) ?? null
  const products = category ? payload.products.filter((p) => p.category_id === category.id) : payload.products
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="st-section-title st-display mb-6">{category ? category.name : 'כל המוצרים'}</h1>
      <div className="mb-8">
        <CategoryNav payload={payload} basePath={basePath} active={category?.id ?? null} />
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} basePath={basePath} template={payload.settings.template} canOrder={payload.order_gate === 'ok'} priorityCount={4} />
      ) : (
        <p className="st-muted py-16 text-center">אין כרגע מוצרים בקטגוריה הזו.</p>
      )}
    </div>
  )
}
