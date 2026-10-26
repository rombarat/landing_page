import type { Metadata } from 'next'
import { StoreShell } from '@/components/store/store-shell'
import { loadPreviewStore } from '@/lib/data/store-context'

export const metadata: Metadata = { title: 'תצוגה מקדימה', robots: { index: false } }

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const payload = await loadPreviewStore()
  return (
    <StoreShell payload={payload} basePath="/preview" preview>
      {children}
    </StoreShell>
  )
}
