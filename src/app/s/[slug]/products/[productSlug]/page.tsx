import type { Metadata } from 'next'
import { ProductBody } from '@/components/store/pages'
import { loadPublicStore } from '@/lib/data/store-context'
import { mediaUrl } from '@/lib/media'

type Params = { params: Promise<{ slug: string; productSlug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, productSlug } = await params
  const payload = await loadPublicStore(slug)
  const product = payload.products.find((p) => p.slug === productSlug)
  if (!product) return {}
  const image = product.images[0]?.path
  return { title: product.name, description: product.description.slice(0, 160) || undefined, openGraph: { images: image ? [mediaUrl(image, 'full')!] : undefined } }
}

export default async function ProductPage({ params }: Params) {
  const { slug, productSlug } = await params
  const payload = await loadPublicStore(slug, `/products/${productSlug}`)
  return <ProductBody payload={payload} basePath={`/s/${payload.store.slug}`} productSlug={productSlug} />
}
