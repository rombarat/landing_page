import type { Metadata } from 'next'
import { CartBody } from '@/components/store/pages'
import { loadPublicStore } from '@/lib/data/store-context'

export const metadata: Metadata = { title: 'העגלה', robots: { index: false } }

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await loadPublicStore(slug, '/cart')
  return <CartBody payload={payload} basePath={`/s/${payload.store.slug}`} />
}
