import type { Metadata } from 'next'
import { CatalogBody } from '@/components/store/pages'
import { loadPublicStore } from '@/lib/data/store-context'

export const metadata: Metadata = { title: 'כל המוצרים' }

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ category?: string }> }) {
  const [{ slug }, { category }] = await Promise.all([params, searchParams])
  const payload = await loadPublicStore(slug, '/catalog')
  return <CatalogBody payload={payload} basePath={`/s/${payload.store.slug}`} category={category} />
}
