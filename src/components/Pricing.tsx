import { LinkButton } from './ui/Button'
import { CheckIcon, WhatsAppIcon } from './icons'
import { config, formatDeadlineHebrew, whatsappLink } from '../config'

const includes = [
  'עיצוב מותאם לעסק שלך',
  'התאמה מלאה לנייד',
  'כפתור וואטסאפ',
  'טופס יצירת קשר',
  'חיבור לדומיין',
  'העלאה לאוויר',
  'עד 2 סבבי תיקונים',
]

export function Pricing() {
  return (
    <section id="pricing" className="section-y bg-surface border-y border-line">
      <div className="container-page">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-6">
            <div className="gold-rule">
              <span className="text-sm text-gold font-display font-medium">מחיר השקה מיוחד</span>
            </div>

            <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter">
              כמה זה עולה?
            </h2>

            <p className="mt-8 text-lg text-ink2 leading-relaxed max-w-xl">
              דף נחיתה מקצועי, שלם, מותאם לעסק שלך — בסכום שיתאים לכל עסק קטן או בינוני.
            </p>

            <div className="mt-10 flex flex-wrap items-baseline gap-4">
              <div className="font-display font-bold text-ink text-7xl sm:text-8xl leading-none tracking-tighter">
                500
                <span className="text-gold">₪</span>
              </div>
              <div className="text-sm text-muted">
                מחיר השקה. בתוקף עד {formatDeadlineHebrew()}.
              </div>
            </div>

            <div className="mt-10 flex justify-center lg:justify-start">
              <LinkButton
                href={whatsappLink('היי, אשמח לפרטים על הצעת ההשקה לדף נחיתה')}
                variant="whatsapp"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="h-5 w-5" />
                אני רוצה להתחיל
              </LinkButton>
            </div>
          </div>

          <div className="lg:col-span-6 lg:pt-2">
            <div className="rounded-2xl border border-line bg-page p-8 sm:p-10">
              <div className="text-sm text-muted">כולל</div>
              <ul className="mt-6 space-y-4">
                {includes.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold/40 text-gold">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-lg text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
