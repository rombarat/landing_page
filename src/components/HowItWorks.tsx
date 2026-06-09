const steps = [
  {
    n: '01',
    title: 'שולחים הודעה',
    body: 'מספרים לי בקצרה על העסק.',
  },
  {
    n: '02',
    title: 'אני בונה את הדף',
    body:
      'אתם שולחים תמונות, לוגו או כל חומר קיים. אם צריך עזרה בכתיבה — אני עוזר גם בזה.',
  },
  {
    n: '03',
    title: 'עולים לאוויר',
    body:
      'בתוך 3 ימי עסקים הדף מוכן. עוברים עליו יחד, עושים התאמות אחרונות ומעלים אותו.',
  },
]

export function HowItWorks() {
  return (
    <section id="process" className="section-y bg-page">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">התהליך</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          איך זה עובד?
        </h2>

        <ol className="mt-16 lg:mt-20 divide-y divide-line border-y border-line">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-start py-10 sm:py-14 group"
            >
              <div className="lg:col-span-2">
                <div className="font-display text-7xl sm:text-8xl lg:text-[120px] font-bold leading-none tracking-tightest text-line2 group-hover:text-gold transition-colors duration-500">
                  {s.n}
                </div>
              </div>

              <div className="lg:col-span-10">
                <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-bold font-display text-ink tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-2xl">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
