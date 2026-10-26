import { CheckoutBody } from '@/components/store/pages'
import { loadPreviewStore } from '@/lib/data/store-context'

export default async function PreviewCheckout() {
  return <CheckoutBody payload={await loadPreviewStore()} basePath="/preview" />
}
