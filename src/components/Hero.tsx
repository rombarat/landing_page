import { LinkButton } from './ui/Button'
import { WhatsAppIcon } from './icons'
import { whatsappLink, config } from '../config'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-page">
      <div aria-hidden="true" className="absolute inset-0 spotlight" />

      <div className="container-page relative pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36">
        {/* MEGA headline */}
        <h1 className="text-mega font-bold font-display text-ink max-w-[18ch]">
          עסק טוב צריך להיראות
          <br />
          <span className="text-muted">כמו </span>
          <span className="text-gold">עסק טוב.</span>
        </h1>

        <p className="mt-8 text-xl sm:text-2xl text-ink2 font-display font-medium max-w-2xl leading-snug">
          אתר מקצועי לעסק שלך.
          <br />
          בלי להסתבך. בלי להוציא אלפי שקלים.
        </p>

        <p className="mt-10 text-lg text-ink2 leading-relaxed max-w-2xl">
          אם העסק שלך עדיין מתנהל דרך הודעות וואטסאפ, פייסבוק או כרטיס ביקור דיגיטלי —
          הגיע הזמן שיהיה לך מקום מקצועי שמציג אותך כמו שצריך.
        </p>

        <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-2xl">
          אני בונה דפי נחיתה לעסקים קטנים ובינוניים תוך {config.deliveryDays} בלבד.
        </p>

        {/* Price callout */}
        <div className="mt-10 flex justify-center lg:justify-start">
          <div className="inline-flex items-baseline gap-3 rounded-full border border-line2 bg-surface/60 backdrop-blur px-5 py-2.5">
            <span className="text-sm text-muted">מחיר השקה</span>
            <span className="font-display font-bold text-gold text-xl">{config.launchPrice}</span>
            <span className="text-sm text-muted">בלבד</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center lg:justify-start">
          <LinkButton
            href={whatsappLink()}
            variant="whatsapp"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="פנייה בוואטסאפ"
          >
            <WhatsAppIcon className="h-5 w-5" />
            שלחו לי הודעה בוואטסאפ
          </LinkButton>
        </div>
      </div>
    </section>
  )
}
