import { ProductBody } from '@/components/store/pages'
import { loadPreviewStore } from '@/lib/data/store-context'

export default async function PreviewProduct({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params
  return <ProductBody payload={await loadPreviewStore()} basePath="/preview" productSlug={productSlug} />
}
