import { BrandMark } from '@/components/brand'
import { Stepper } from '@/components/onboarding/stepper'
import { requireClaims } from '@/lib/auth'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireClaims('/onboarding')
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />
          <Stepper />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
        {children}
      </main>
    </div>
  )
}
