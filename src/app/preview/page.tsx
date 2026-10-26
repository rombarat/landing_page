import { HomeBody } from '@/components/store/pages'
import { loadPreviewStore } from '@/lib/data/store-context'

export default async function PreviewHome() {
  return <HomeBody payload={await loadPreviewStore()} basePath="/preview" />
}
