import { LinkButton } from './ui/Button'
import { WhatsAppIcon } from './icons'
import { whatsappLink, config, formatDeadlineHebrew } from '../config'

export function FinalCTA() {
  return (
    <section id="contact" className="bg-page text-ink relative overflow-hidden border-t border-line">
      <div aria-hidden="true" className="absolute inset-0 spotlight" />

      <div className="container-page section-y relative">
        <div className="max-w-4xl">
          <div className="gold-rule">
            <span className="text-sm text-gold font-display font-medium">מוכנים להתקדם?</span>
          </div>

          <h2 className="mt-6 text-mega font-bold font-display leading-[0.98] tracking-tightest text-ink">
            מוכנים שגם לעסק שלכם
            <br />
            <span className="text-muted">יהיה אתר מקצועי?</span>
          </h2>

          <p className="mt-10 text-lg sm:text-xl text-ink2 leading-relaxed max-w-2xl">
            בכמה דקות אפשר להבין אם זה מתאים לכם.
          </p>

          <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-2xl">
            שלחו הודעה בוואטסאפ, ספרו לי מה העסק שלכם עושה, ונראה איך אפשר לבנות
            לכם דף שיציג אותו בצורה הטובה ביותר.
          </p>

          {/* Price callout */}
          <div className="mt-10 flex justify-center lg:justify-start">
            <div className="inline-flex items-baseline gap-3 rounded-full border border-line2 bg-surface/60 backdrop-blur px-5 py-2.5">
              <span className="text-sm text-muted">מחיר ההשקה</span>
              <span className="font-display font-bold text-gold text-xl">{config.launchPrice}</span>
              <span className="text-sm text-muted">· בתוקף עד {formatDeadlineHebrew()}</span>
            </div>
          </div>

          <div className="mt-10 flex justify-center lg:justify-start">
            <LinkButton
              href={whatsappLink()}
              variant="whatsapp"
              size="lg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base sm:text-lg h-16 px-8"
            >
              <WhatsAppIcon className="h-6 w-6" />
              שלחו לי הודעה בוואטסאפ
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
      </div>
    </section>
  )
}
