import Image from 'next/image'
import { CTA_LABEL, Faq, MarketingFooter, MarketingHeader, Phone, PlanCard, PriceTag } from '@/components/marketing/marketing'
import { LinkButton } from '@/components/ui/button'
import { TEMPLATES } from '@/lib/themes'

const STEPS = [
  {
    title: 'מעלים תמונות',
    text: 'בוחרים את כל התמונות בבת אחת מהגלריה. כל תמונה הופכת לכרטיס מוצר.',
    image: '/marketing/step-upload.webp',
    alt: 'מסך העלאת מוצרים: כל תמונה הופכת לכרטיס',
  },
  {
    title: 'כותבים שם ומחיר',
    text: 'שתי שורות לכל מוצר, הכול בעמוד אחד. כמה תמונות של אותו מוצר? מאחדים בלחיצה.',
    image: '/marketing/step-products.webp',
    alt: 'כרטיסי מוצרים עם שם ומחיר',
  },
  {
    title: 'בוחרים סגנון ומפרסמים',
    text: 'החנות נבנית מהמוצרים שלכם. בוחרים סגנון וצבעים, לוחצים על פרסום, ומקבלים קישור לשתף.',
    image: '/marketing/step-design.webp',
    alt: 'בחירת סגנון לחנות עם תמונת המוצר שלכם',
  },
]

export default function Home() {
  return (
    <>
      <MarketingHeader />
      <main id="main">
        {/* Hero: the stall. Real photos with price tags become a real store. */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pb-24">
            <div>
              <h1 className="font-display text-[clamp(4rem,13vw,8.5rem)] leading-[0.82] text-ink">
                יש לך מוצרים?
                <br />
                יש לך חנות.
              </h1>
              <p className="mt-7 max-w-md text-xl leading-relaxed text-ink-soft">מעלים תמונות ומחירים, בוחרים עיצוב, והחנות שלך מוכנה.</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <LinkButton href="/signup" size="lg">
                  {CTA_LABEL}
                </LinkButton>
                <LinkButton href="#how" size="lg" variant="ghost">
                  איך זה עובד
                </LinkButton>
              </div>
              <p className="mt-5 text-sm text-muted">7 ימי ניסיון מהפרסום, בלי כרטיס אשראי. אחר כך 99 ₪ לחודש.</p>
            </div>

            <div className="relative mx-auto w-full max-w-[30rem]" aria-label="דוגמה: תמונות מוצרים הופכות לחנות">
              <svg className="pointer-events-none absolute -top-2 start-0 hidden h-24 w-full text-line-strong sm:block" viewBox="0 0 480 90" fill="none" aria-hidden>
                <path d="M0 20 Q240 90 480 20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 5" />
              </svg>
              <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-5">
                <div className="mt-6 space-y-5">
                  {[
                    ['/marketing/photo-chocolate-cake.webp', 'עוגת שוקולד', '180 ₪', '-3deg'],
                    ['/marketing/photo-vase.webp', 'אגרטל קרמיקה', '260 ₪', '2deg'],
                    ['/marketing/photo-gold-ring.webp', 'טבעת', '420 ₪', '-1.5deg'],
                  ].map(([src, alt, price, rot], i) => (
                    <figure key={src} className={`animate-rise relative w-[82%] ${i === 1 ? 'ms-auto' : ''}`} style={{ animationDelay: `${120 + i * 140}ms`, rotate: rot }}>
                      <Image src={src!} alt={alt!} width={520} height={520} priority={i === 0} sizes="160px" className="aspect-square w-full rounded-md border-4 border-surface object-cover shadow-float" />
                      <PriceTag className="absolute -bottom-3 end-2">{price}</PriceTag>
                    </figure>
                  ))}
                </div>
                <div className="animate-rise" style={{ animationDelay: '560ms' }}>
                  <Phone src="/marketing/tpl-artisan.webp" alt="חנות לדוגמה בסגנון סדנה, כפי שהיא נראית בטלפון" priority />
                  <p className="mt-3 text-center text-xs text-muted">צילום מסך אמיתי של חנות לדוגמה</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-2xl font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9]">שלושה צעדים, בלי מתכנת</h2>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">לא צריך לבנות עמודים, לבחור תוספים או לחבר שרתים. אתם מביאים את המוצרים, אנחנו בונים את החנות.</p>
            <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-6xl leading-none text-turmeric-deep tabular-nums">{i + 1}</span>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.text}</p>
                  <div className="mt-6 h-[26rem] overflow-hidden rounded-t-[2rem] border-[6px] border-b-0 border-ink bg-ink">
                    <Image src={step.image} alt={step.alt} width={780} height={1688} sizes="(min-width: 768px) 30vw, 90vw" className="block h-auto w-full rounded-t-[1.6rem]" />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="templates" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-3xl font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9]">אותם מוצרים, שלושה אופיים</h2>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">כל סגנון מגיע עם טיפוגרפיה, צבעים ומבנה משלו. מחליפים בלחיצה, והמוצרים וההזמנות נשארים במקום.</p>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {(['artisan', 'boutique', 'bold'] as const).map((key) => (
                <figure key={key}>
                  <Phone src={`/marketing/tpl-${key}.webp`} alt={`חנות לדוגמה בסגנון ${TEMPLATES[key].name}`} />
                  <figcaption className="mt-5">
                    <span className="text-lg font-semibold">{TEMPLATES[key].name}</span>
                    <span className="block text-ink-soft">{TEMPLATES[key].tagline}</span>
                    <span className="block text-sm text-muted">מתאים ל{TEMPLATES[key].fits}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">החנויות בתמונות הן חנויות לדוגמה, עם מוצרים מאוירים.</p>
          </div>
        </section>

        <section className="border-y border-line bg-sunken">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h2 className="font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9]">ההזמנות מגיעות למקום אחד</h2>
              <ul className="mt-8 space-y-5 text-lg">
                <li>
                  <strong className="block">כל ההזמנות בדשבורד אחד</strong>
                  <span className="text-ink-soft">מה הוזמן, כמה, מתי לאסוף, והערות הלקוח.</span>
                </li>
                <li>
                  <strong className="block">סטטוס לכל הזמנה</strong>
                  <span className="text-ink-soft">חדשה, אושרה, בהכנה, מוכנה לאיסוף, הושלמה.</span>
                </li>
                <li>
                  <strong className="block">וואטסאפ ללקוח בלחיצה</strong>
                  <span className="text-ink-soft">נפתחת שיחה עם הודעה מוכנה, ואתם שולחים.</span>
                </li>
              </ul>
            </div>
            <figure className="overflow-hidden rounded-lg border border-line-strong bg-surface shadow-float">
              <div className="flex h-8 items-center gap-1.5 border-b border-line bg-paper px-3" aria-hidden>
                <span className="size-2.5 rounded-full bg-line-strong" />
                <span className="size-2.5 rounded-full bg-line-strong" />
                <span className="size-2.5 rounded-full bg-line-strong" />
              </div>
              <Image src="/marketing/dashboard-order.webp" alt="דשבורד הסוחר: פרטי הזמנה, סטטוס ופרטי הלקוח" width={2720} height={1720} sizes="(min-width: 1024px) 60vw, 100vw" className="block h-auto w-full" />
            </figure>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="mb-10 font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9]">מחיר אחד, פשוט</h2>
            <PlanCard />
          </div>
        </section>

        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <h2 className="font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9]">שאלות שעולות</h2>
            <Faq />
          </div>
        </section>

        <section className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
            <p className="font-display text-[clamp(3rem,9vw,6rem)] leading-[0.85]">התמונות כבר בטלפון.</p>
            <p className="mt-4 max-w-md text-lg text-white/75">עוד כמה דקות הן יכולות להיות חנות.</p>
            <LinkButton href="/signup" size="lg" className="mt-9">
              {CTA_LABEL}
            </LinkButton>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  )
}
