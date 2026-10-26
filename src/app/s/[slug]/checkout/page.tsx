import type { Metadata } from 'next'
import { CheckoutBody } from '@/components/store/pages'
import { loadPublicStore } from '@/lib/data/store-context'

export const metadata: Metadata = { title: 'השלמת הזמנה', robots: { index: false } }

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await loadPublicStore(slug, '/checkout')
  return <CheckoutBody payload={payload} basePath={`/s/${payload.store.slug}`} />
}
