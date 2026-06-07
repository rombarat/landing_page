import { LinkButton } from './ui/Button'
import { WhatsAppIcon, ArrowLeftIcon } from './icons'
import { whatsappLink, config } from '../config'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-page">
      <div aria-hidden="true" className="absolute inset-0 spotlight" />

      <div className="container-page relative pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-line2 bg-surface/60 backdrop-blur px-4 py-2 text-sm text-ink2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-wa opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-wa" />
          </span>
          זמין לפרויקטים חדשים השבוע
        </div>

        {/* MEGA headline */}
        <h1 className="mt-10 text-mega font-bold font-display text-ink max-w-[18ch]">
          דפי נחיתה
          <br />
          <span className="text-muted">שעובדים</span>{' '}
          <span className="text-gold">בשבילך.</span>
        </h1>

        <div className="mt-12 lg:mt-16 grid lg:grid-cols-12 gap-10 items-end">
          <p className="lg:col-span-6 text-lg sm:text-xl text-ink2 leading-relaxed max-w-xl">
            לעסקים קטנים ובינוניים בישראל. מהירים, נראים מעולה בנייד,
            ומביאים את הלקוחות ישר לוואטסאפ שלך.
          </p>

          {/* Stats row */}
          <dl className="lg:col-span-6 grid grid-cols-3 gap-6 lg:gap-8 lg:justify-self-end lg:max-w-md w-full">
            <div className="gold-rule">
              <dd className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none">
                3
              </dd>
              <dt className="mt-2 text-sm text-muted">ימי עסקים</dt>
            </div>
            <div className="gold-rule">
              <dd className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none">
                500<span className="text-muted">₪</span>
              </dd>
              <dt className="mt-2 text-sm text-muted">מחיר השקה</dt>
            </div>
            <div className="gold-rule">
              <dd className="font-display text-3xl sm:text-4xl font-bold text-ink leading-none">
                4<span className="text-gold">+</span>
              </dd>
              <dt className="mt-2 text-sm text-muted">דפים באוויר</dt>
            </div>
          </dl>
        </div>

        {/* CTAs */}
        <div className="mt-12 lg:mt-16 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <LinkButton
            href={whatsappLink()}
            variant="whatsapp"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="פנייה בוואטסאפ"
          >
            <WhatsAppIcon className="h-5 w-5" />
            דברו איתי בוואטסאפ
          </LinkButton>
          <LinkButton href="#contact" variant="secondary" size="lg">
            להשארת פרטים
            <ArrowLeftIcon className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>
    </section>
  )
}
