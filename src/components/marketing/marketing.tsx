import Image from 'next/image'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { BrandMark } from '@/components/brand'
import { LinkButton } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export const CTA_LABEL = 'בואו נבנה את החנות שלי'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <BrandMark />
        <nav aria-label="ניווט באתר" className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          <Link href="/#how" className="hover:text-ink">
            איך זה עובד
          </Link>
          <Link href="/#templates" className="hover:text-ink">
            עיצובים
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            מחיר
          </Link>
          <Link href="/#faq" className="hover:text-ink">
            שאלות
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link href="/login" className="hidden px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink sm:inline">
            התחברות
          </Link>
          <LinkButton href="/signup" size="sm">
            פותחים חנות
          </LinkButton>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-10 text-sm text-muted sm:px-6">
        <BrandMark />
        <nav aria-label="קישורים" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/pricing" className="hover:text-ink">
            מחיר
          </Link>
          <Link href="/login" className="hover:text-ink">
            התחברות
          </Link>
          <Link href="/signup" className="hover:text-ink">
            פתיחת חנות
          </Link>
        </nav>
        <p className="ms-auto">חנויות אונליין לעסקים קטנים בישראל</p>
      </div>
    </footer>
  )
}

/** Phone frame around a real screenshot of the product. */
export function Phone({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[2.2rem] border-[7px] border-ink bg-ink shadow-float', className)}>
      <Image src={src} alt={alt} width={780} height={1688} priority={priority} sizes="(min-width: 1024px) 300px, 70vw" className="block h-auto w-full rounded-[1.7rem]" />
    </div>
  )
}

export function PriceTag({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn('price-tag text-base tabular-nums shadow-[0_6px_14px_-6px_rgb(27_31_59/0.45)]', className)} style={style}>
      {children}
    </span>
  )
}

const INCLUDED = [
  'חנות מעוצבת בכתובת משלך, מוכנה לטלפון',
  'העלאת הרבה תמונות בבת אחת, כרטיס מוצר לכל תמונה',
  'עגלת קניות והזמנות לאיסוף עצמי',
  'ניהול הזמנות וסטטוסים, והודעת וואטסאפ ללקוח בלחיצה',
  'שלושה סגנונות עיצוב, צבעים, גופנים ולוגו',
]
const NOT_YET = ['סליקת אשראי באתר: הלקוחות משלמים לכם ישירות', 'משלוחים: בינתיים רק איסוף עצמי', 'דומיין פרטי משלכם']

export function PlanCard() {
  return (
    <div className="grid overflow-hidden rounded-xl border border-ink bg-surface md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="bg-ink p-8 text-white sm:p-10">
        <p className="text-lg font-semibold">מסלול אחד, בלי הפתעות</p>
        <p className="mt-4 font-display text-[6rem] leading-[0.8] tabular-nums">
          99 ₪
        </p>
        <p className="mt-2 text-white/75">לחודש, אחרי 7 ימי ניסיון בחינם</p>
        <p className="mt-6 text-sm leading-relaxed text-white/75">
          ימי הניסיון מתחילים רק כשמפרסמים את החנות, לא בהרשמה. לא צריך כרטיס אשראי כדי להתחיל. אם לא ממשיכים, החנות מפסיקה לקבל הזמנות חדשות, והמוצרים וההזמנות נשמרים.
        </p>
        <LinkButton href="/signup" size="lg" className="mt-8 w-full sm:w-auto">
          {CTA_LABEL}
        </LinkButton>
      </div>
      <div className="grid gap-8 p-8 sm:p-10">
        <div>
          <p className="font-semibold">מה כלול</p>
          <ul className="mt-3 space-y-2.5">
            {INCLUDED.map((t) => (
              <li key={t} className="flex gap-2.5 text-ink-soft">
                <Check className="mt-0.5 size-5 shrink-0 text-olive" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">מה עוד אין, כדי שיהיה ברור</p>
          <ul className="mt-3 space-y-2.5">
            {NOT_YET.map((t) => (
              <li key={t} className="flex gap-2.5 text-muted">
                <Minus className="mt-0.5 size-5 shrink-0" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const FAQ = [
  ['צריך לדעת משהו בטכנולוגיה?', 'לא. אם אתם יודעים לשלוח תמונה בוואטסאפ, אתם יודעים לבנות כאן חנות. מעלים תמונות, כותבים שם ומחיר, ובוחרים סגנון. אין קוד ואין הגדרות שרת.'],
  ['איך הלקוחות משלמים?', 'בגרסה הזו אין סליקה באתר. הלקוח שולח הזמנה, אתם מאשרים, והתשלום עובר ביניכם: מזומן, ביט או העברה. בעגלה ובאישור ההזמנה כתוב בבירור שלא בוצע תשלום באתר.'],
  ['אפשר לשנות את העיצוב אחר כך?', 'בכל רגע. מחליפים סגנון, צבעים, גופן, לוגו, כותרות ותמונה ראשית, והחנות מתעדכנת מיד. המוצרים וההזמנות לא נפגעים.'],
  ['מה קורה כשנגמרים ימי הניסיון?', 'החנות נשארת גלויה, אבל לא מקבלת הזמנות חדשות עד שמפעילים מנוי. שום דבר לא נמחק: המוצרים, התמונות וההזמנות נשמרים.'],
  ['איך אני יודע שהגיעה הזמנה?', 'ההזמנות מופיעות בדשבורד, שמתרענן מעצמו כשהוא פתוח. מכל הזמנה אפשר לפתוח שיחת וואטסאפ עם הלקוח עם הודעה מוכנה. התראות אוטומטיות במייל או בוואטסאפ עוד לא קיימות.'],
  ['אפשר להעלות כמה תמונות לאותו מוצר?', 'כן, עד 8. אפשר להוסיף תמונות לכרטיס, או לסמן כמה כרטיסים ולאחד אותם למוצר אחד.'],
  ['מה עם הפרטיות של הלקוחות שלי?', 'פרטי ההזמנות גלויים רק לכם. כל חנות מופרדת מהאחרות ברמת מסד הנתונים, והלקוחות רואים רק את מה שפרסמתם.'],
]

export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-xl leading-none transition-transform duration-200 group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  )
}
