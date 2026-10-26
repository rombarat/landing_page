import { CatalogBody } from '@/components/store/pages'
import { loadPreviewStore } from '@/lib/data/store-context'

export default async function PreviewCatalog({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  return <CatalogBody payload={await loadPreviewStore()} basePath="/preview" category={category} />
}
