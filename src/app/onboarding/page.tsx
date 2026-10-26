import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BusinessForm } from '@/components/onboarding/business-form'
import { getMerchantStore, requireClaims } from '@/lib/auth'

export const metadata: Metadata = { title: 'פרטי העסק' }

export default async function OnboardingBusiness() {
  const claims = await requireClaims('/onboarding')
  if (await getMerchantStore(claims)) redirect('/onboarding/products')
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-display-sm text-ink sm:text-display">ספרו לנו על העסק</h1>
      <p className="mt-3 text-lg text-muted">רק הבסיס. את כל השאר אפשר לשנות אחר כך.</p>
      <BusinessForm siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''} />
    </div>
  )
}
