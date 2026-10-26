import { HomeBody } from '@/components/store/pages'
import { loadPublicStore } from '@/lib/data/store-context'

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await loadPublicStore(slug)
  return <HomeBody payload={payload} basePath={`/s/${payload.store.slug}`} />
}
