import type { Metadata } from 'next'
import { Faq, MarketingFooter, MarketingHeader, PlanCard } from '@/components/marketing/marketing'

export const metadata: Metadata = { title: 'מחיר', description: '7 ימי ניסיון מהפרסום, אחר כך 99 ₪ לחודש. בלי כרטיס אשראי כדי להתחיל.' }

export default function PricingPage() {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-[clamp(3.5rem,10vw,6.5rem)] leading-[0.85]">99 ₪ לחודש. זהו.</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">מסלול אחד עם כל מה שצריך כדי למכור לקוחות לאיסוף עצמי. מתחילים בחינם, ומשלמים רק אם ממשיכים.</p>
        <div className="mt-12">
          <PlanCard />
        </div>
        <h2 className="mb-6 mt-20 font-display text-5xl leading-none">שאלות</h2>
        <Faq />
      </main>
      <MarketingFooter />
    </>
  )
}
