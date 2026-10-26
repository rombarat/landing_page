import type { Metadata } from 'next'
import { StoreShell } from '@/components/store/store-shell'
import { loadPublicStore } from '@/lib/data/store-context'
import { mediaUrl } from '@/lib/media'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const payload = await loadPublicStore(slug)
  const image = payload.settings.hero_image_path ?? payload.products.find((p) => p.images[0])?.images[0]?.path
  return {
    title: { default: payload.store.name, template: `%s | ${payload.store.name}` },
    description: payload.store.description || `החנות של ${payload.store.name}`,
    openGraph: { title: payload.store.name, description: payload.store.description, images: image ? [mediaUrl(image, 'full')!] : undefined, locale: 'he_IL' },
  }
}

export default async function StoreLayout({ params, children }: Params & { children: React.ReactNode }) {
  const { slug } = await params
  const payload = await loadPublicStore(slug)
  return (
    <StoreShell payload={payload} basePath={`/s/${payload.store.slug}`}>
      {children}
    </StoreShell>
  )
}
