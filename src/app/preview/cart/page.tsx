import { CartBody } from '@/components/store/pages'
import { loadPreviewStore } from '@/lib/data/store-context'

export default async function PreviewCart() {
  return <CartBody payload={await loadPreviewStore()} basePath="/preview" />
}
