import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard/page-header'
import { SettingsForms } from '@/components/dashboard/settings-forms'
import { requireMerchant } from '@/lib/auth'
import { getStorePreview } from '@/lib/data/storefront'
import { serverEnv } from '@/lib/env'

export const metadata: Metadata = { title: 'הגדרות' }

export default async function SettingsPage() {
  const { claims, store } = await requireMerchant('/dashboard/settings')
  const payload = await getStorePreview(claims, store.id)
  if (!payload) return null
  return (
    <>
      <PageHeader title="הגדרות" description="פרטי העסק, איסוף, כתובת החנות ונראות." />
      <SettingsForms store={store} settings={payload.settings} siteUrl={serverEnv.siteUrl} />
    </>
  )
}
