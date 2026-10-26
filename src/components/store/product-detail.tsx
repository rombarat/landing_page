import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/format'
import type { PublicProduct, StorePayload } from '@/lib/types'
import { ProductGrid } from './product-card'
import { BuyBox, Gallery } from './product-detail-client'

export function ProductDetail({ payload, product, basePath }: { payload: StorePayload; product: PublicProduct; basePath: string }) {
  const tpl = payload.settings.template
  const canOrder = payload.order_gate === 'ok'
  const category = payload.categories.find((c) => c.id === product.category_id)
  const related = payload.products
    .filter((p) => p.id !== product.id && (category ? p.category_id === category.id : true))
    .slice(0, 4)
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <nav aria-label="פירורי לחם" className="st-muted mb-6 flex items-center gap-1 text-sm">
        <Link href={basePath} className="hover:underline">
          ראשי
        </Link>
        <ChevronRight className="size-4 rotate-180" aria-hidden />
        {category ? (
          <Link href={`${basePath}/catalog?category=${category.id}`} className="hover:underline">
            {category.name}
          </Link>
        ) : (
          <Link href={`${basePath}/catalog`} className="hover:underline">
            כל המוצרים
          </Link>
        )}
      </nav>
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <Gallery images={product.images} name={product.name} template={tpl} />
        <div className={cn(tpl === 'boutique' && 'md:pt-10')}>
          <h1 className={cn('st-display leading-tight', tpl === 'bold' ? 'text-[clamp(2.2rem,6vw,3.8rem)]' : 'text-[clamp(2rem,5vw,3rem)]')}>{product.name}</h1>
          <p className={cn('st-price mt-3 text-2xl tabular-nums')}>{formatPrice(product.price_agorot)}</p>
          {product.description && <p className="mt-6 max-w-prose whitespace-pre-line text-lg leading-relaxed">{product.description}</p>}
          <div className="mt-8">
            <BuyBox product={product} canOrder={canOrder} cartHref={`${basePath}/cart`} />
          </div>
          <p className="st-muted mt-6 text-sm leading-relaxed">איסוף עצמי מהעסק. {payload.settings.payment_note}</p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="st-section-title st-display mb-8">עוד מהחנות</h2>
          <ProductGrid products={related} basePath={basePath} template={tpl} canOrder={canOrder} />
        </section>
      )}
    </div>
  )
}
