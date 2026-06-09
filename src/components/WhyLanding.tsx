import { CheckIcon } from './icons'

const reasons = [
  'כי אנשים שומעים עליך, אבל לא תמיד מבינים מי אתה.',
  'כי לקוחות מבקשים פרטים, ואתה מוצא את עצמך מסביר שוב ושוב את אותו הדבר.',
  'כי העסק שלך טוב, אבל הוא עדיין לא נראה כמו עסק רציני באינטרנט.',
]

const understands = [
  'מה אתה עושה',
  'למה כדאי לעבוד דווקא איתך',
  'איך יוצרים איתך קשר',
]

export function WhyLanding() {
  return (
    <section id="why-landing" className="section-y bg-surface border-y border-line">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">למה דף נחיתה</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          למה בכלל
          <br />
          <span className="text-muted">צריך דף נחיתה?</span>
        </h2>

        <ul className="mt-14 lg:mt-16 space-y-8 max-w-3xl">
          {reasons.map((r, i) => (
            <li key={r} className="flex items-baseline gap-5">
              <span
                aria-hidden="true"
                className="font-display font-bold text-gold text-2xl leading-none shrink-0 w-8"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-xl sm:text-2xl text-ink leading-snug font-display font-medium">
                {r}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-16 lg:mt-20 border-t border-line pt-10 max-w-3xl">
          <p className="text-lg text-ink2 leading-relaxed">
            דף נחיתה טוב נותן ללקוחות להבין תוך כמה שניות:
          </p>
          <ul className="mt-6 space-y-4">
            {understands.map((u) => (
              <li key={u} className="flex items-center gap-3">
                <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold/40 text-gold">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-lg text-ink">{u}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
