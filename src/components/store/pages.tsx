import { notFound } from 'next/navigation'
import type { StorePayload } from '@/lib/types'
import { CartView } from './cart'
import { StoreCatalog } from './catalog'
import { CheckoutForm } from './checkout-form'
import { ProductDetail } from './product-detail'
import { StoreHome } from './store-home'
import { ORDER_GATE_MESSAGE } from './store-shell'

// Page bodies shared by the public storefront (/s/[slug]) and the merchant preview (/preview).

export function HomeBody({ payload, basePath }: { payload: StorePayload; basePath: string }) {
  return <StoreHome payload={payload} basePath={basePath} />
}

export function CatalogBody({ payload, basePath, category }: { payload: StorePayload; basePath: string; category?: string }) {
  return <StoreCatalog payload={payload} basePath={basePath} categoryId={category} />
}

export function ProductBody({ payload, basePath, productSlug }: { payload: StorePayload; basePath: string; productSlug: string }) {
  const product = payload.products.find((p) => p.slug === productSlug)
  if (!product) notFound()
  return <ProductDetail payload={payload} product={product} basePath={basePath} />
}

export function CartBody({ payload, basePath }: { payload: StorePayload; basePath: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="st-section-title st-display mb-6 text-start!">העגלה שלך</h1>
      <CartView products={payload.products} basePath={basePath} canOrder={payload.order_gate === 'ok'} closedMessage={ORDER_GATE_MESSAGE[payload.order_gate]} />
    </div>
  )
}

export function CheckoutBody({ payload, basePath }: { payload: StorePayload; basePath: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="st-section-title st-display mb-2 text-start!">פרטים לאיסוף</h1>
      <p className="st-muted mb-8">ממלאים פרטים, שולחים, והעסק חוזר אליכם לאישור ההזמנה.</p>
      <CheckoutForm
        slug={payload.store.slug}
        products={payload.products}
        settings={payload.settings}
        basePath={basePath}
        canOrder={payload.order_gate === 'ok'}
        closedMessage={ORDER_GATE_MESSAGE[payload.order_gate] ?? ''}
      />
    </div>
  )
}
