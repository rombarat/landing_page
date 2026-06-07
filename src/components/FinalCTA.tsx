import { LinkButton } from './ui/Button'
import { WhatsAppIcon } from './icons'
import { LeadForm } from './LeadForm'
import { whatsappLink, config, formatDeadlineHebrew } from '../config'

export function FinalCTA() {
  return (
    <section id="contact" className="bg-page text-ink relative overflow-hidden border-t border-line">
      <div aria-hidden="true" className="absolute inset-0 spotlight" />

      <div className="container-page section-y relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <div className="gold-rule">
              <span className="text-sm text-gold font-display font-medium">מוכנים להתקדם?</span>
            </div>

            <h2 className="mt-6 text-mega font-bold font-display leading-[0.98] tracking-tightest text-ink">
              הכי קל להתחיל
              <br />
              <span className="text-muted">בוואטסאפ.</span>
            </h2>

            <p className="mt-8 text-lg text-ink2 leading-relaxed max-w-xl">
              לחצו על הכפתור, תיפתח לכם הודעה מוכנה ואני אחזור אליכם בהקדם כדי לקבוע שיחה.
            </p>

            <p className="mt-3 text-sm text-muted">
              תזכורת: מחיר ההשקה ({config.launchPrice}) בתוקף עד {formatDeadlineHebrew()}.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <LinkButton
                href={whatsappLink()}
                variant="whatsapp"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="h-5 w-5" />
                שלחו לי הודעה
              </LinkButton>
              <LinkButton href={`mailto:${config.email}`} variant="secondary" size="lg">
                או במייל
              </LinkButton>
            </div>

            <div className="mt-12 pt-8 border-t border-line grid grid-cols-2 gap-8 max-w-md">
              <div>
                <div className="text-sm text-muted">וואטסאפ</div>
                <div className="mt-1 text-ink" dir="ltr">+972 52 597 0972</div>
              </div>
              <div>
                <div className="text-sm text-muted">אימייל</div>
                <div className="mt-1 text-ink text-sm break-all">{config.email}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  )
}
