import Link from 'next/link'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/format'
import type { TemplateKey } from '@/lib/themes'
import type { PublicProduct } from '@/lib/types'
import { AddToCartButton } from './cart'
import { StoreImage } from './store-image'

export function ProductCard({ product, href, template, canOrder, priority }: { product: PublicProduct; href: string; template: TemplateKey; canOrder: boolean; priority?: boolean }) {
  const [first, second] = product.images
  const sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'
  return (
    <article className="st-card group relative flex flex-col">
      <Link href={href} className="st-product-link block">
        <div className="st-card-media relative">
          {first ? (
            <>
              <StoreImage image={first} alt={product.name} sizes={sizes} priority={priority} />
              {template === 'boutique' && second && (
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <StoreImage image={second} alt="" sizes={sizes} />
                </div>
              )}
            </>
          ) : (
            <div className="grid size-full place-items-center">
              <span className="st-display px-4 text-center text-xl opacity-60">{product.name}</span>
            </div>
          )}
          {!product.in_stock && (
            <span className="absolute start-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white">אזל</span>
          )}
        </div>
      </Link>
      <div className={cn('flex flex-1 gap-2', template === 'boutique' ? 'flex-col items-center pt-4' : 'items-end justify-between pt-3', template === 'bold' && 'p-3')}>
        <div className="min-w-0">
          <h3 className={cn('leading-snug', template === 'bold' ? 'text-lg font-extrabold' : template === 'boutique' ? 'text-base' : 'font-semibold')}>
            <Link href={href} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className={cn('st-price mt-1 tabular-nums', template === 'boutique' && 'text-sm')}>{formatPrice(product.price_agorot)}</p>
        </div>
        {template !== 'boutique' && canOrder && product.in_stock && <AddToCartButton product={product} compact />}
      </div>
    </article>
  )
}

export function ProductGrid({ products, basePath, template, canOrder, priorityCount = 0 }: { products: PublicProduct[]; basePath: string; template: TemplateKey; canOrder: boolean; priorityCount?: number }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3', template === 'boutique' ? 'gap-x-5 gap-y-10 lg:grid-cols-4' : template === 'bold' ? 'gap-4 lg:grid-cols-4' : 'gap-3 sm:gap-5 lg:grid-cols-4')}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} href={`${basePath}/products/${p.slug}`} template={template} canOrder={canOrder} priority={i < priorityCount} />
      ))}
    </div>
  )
}
