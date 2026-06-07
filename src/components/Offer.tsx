import { LinkButton } from './ui/Button'
import { CheckIcon, WhatsAppIcon } from './icons'
import { config, formatDeadlineHebrew, whatsappLink } from '../config'

const includes = [
  'עיצוב נקי, מקצועי ומותאם אישית לעסק שלך',
  'בנוי קודם כל לנייד (Mobile First)',
  'כפתור וואטסאפ צף עם הודעה מוגדרת מראש',
  'טופס השארת פרטים פשוט ונוח (שם, טלפון וכו׳)',
  'חיבור לדומיין שלך והעלאה חלקה לאוויר',
  'עד 2 סבבי תיקונים אחרי המסירה',
]

export function Offer() {
  return (
    <section id="offer" className="section-y bg-page">
      <div className="container-page">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Right column (RTL = first) */}
          <div className="lg:col-span-7">
            <div className="gold-rule">
              <span className="text-sm text-gold font-display font-medium">הצעת השקה</span>
            </div>

            <h2 className="mt-6 text-huge font-bold font-display leading-[1.02] tracking-tighter">
              דף נחיתה מקצועי,
              <br />
              ב־<span className="text-gold">{config.launchPrice}</span>
              <span className="text-muted"> בלבד.</span>
            </h2>

            <p className="mt-8 text-lg text-ink2 leading-relaxed max-w-xl">
              לפני ששורפים כסף על פרסום ממומן, חייבים בסיס חזק — דף שמסביר ללקוח
              למה לבחור דווקא בך, בונה אמון ומייצר פניות.
            </p>

            <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-xl">
              בלי התחייבויות מסובכות, רק שיחת אפיון קצרה ויוצאים לדרך.
            </p>

            <div className="mt-10">
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

          {/* Left column — spec card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
              <div className="flex items-baseline justify-between">
                <div className="text-sm text-muted">דף נחיתה שלם</div>
                <div className="text-sm text-gold">{config.deliveryDays}</div>
              </div>

              <div className="mt-4 font-display font-bold text-ink text-6xl sm:text-7xl leading-none tracking-tighter">
                {config.launchPrice}
              </div>

              <div className="mt-8 pt-6 border-t border-line">
                <div className="text-sm text-muted mb-5">מה כלול בחבילה</div>
                <ul className="space-y-4">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 text-gold">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span className="text-[15px] text-ink2 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-line text-sm">
                <span className="text-muted">ההצעה בתוקף עד </span>
                <span className="text-ink font-medium">{formatDeadlineHebrew()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
