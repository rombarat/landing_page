import { BrandMark } from '@/components/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <main id="main" className="flex flex-col px-5 py-6 sm:px-10">
        <BrandMark />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-end lg:p-14" aria-hidden>
        <div className="absolute inset-x-0 top-0 flex h-16">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={i % 2 === 0 ? 'flex-1 bg-turmeric' : 'flex-1 bg-ink'} style={{ borderRadius: '0 0 999px 999px' }} />
          ))}
        </div>
        <p className="font-display text-display-lg text-white">
          מעלים תמונה.
          <br />
          <span className="text-turmeric">מקבלים חנות.</span>
        </p>
        <p className="mt-6 max-w-md text-lg text-white/75">
          המוצרים שלך, בחנות מעוצבת עם עגלה והזמנות לאיסוף עצמי. בלי מתכנת ובלי לגעת בקוד.
        </p>
      </aside>
    </div>
  )
}
