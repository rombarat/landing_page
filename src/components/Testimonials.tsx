const testimonials = [
  {
    image: '/images/wa-yishi.jpg',
    alt: 'צילום שיחת וואטסאפ עם ישי — לקוח מרוצה',
    quote:
      '"האתר שבנית לי נראה מקצועי ברמה גבוהה, והקידום באמת מביא תוצאות. מגיעות הרבה מאוד פניות ולידים חדשים לעסק."',
    name: 'ישי',
    business: 'פירוק רכבים',
  },
  {
    image: '/images/wa-yael.jpg',
    alt: 'צילום שיחת וואטסאפ עם יעל — לקוחה מרוצה',
    quote:
      '"אני מרוצה ברמות. גם השירות, וגם — לא פחות חשוב — מהתוצאה. עשית את מפעל חיי מסקרן ברמות."',
    name: 'יעל',
    business: 'TLV Young',
  },
  {
    image: '/images/wa-yosef.jpg',
    alt: 'צילום שיחת וואטסאפ עם יוסף — לקוח מרוצה',
    quote:
      '"אחי אתה מקצוען בטירוף, בחיים לא האמנתי שיצא ככה. ממש יפה וחזק. תודה רבה."',
    name: 'יוסף בר אשר',
    business: 'טעמי שמחה — קייטרינג',
  },
]

function PhoneFrame({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <div className="relative rounded-[2rem] border-[8px] border-ink2/20 bg-surface p-0 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-5 w-20 rounded-b-2xl bg-ink2/20" />
        <div className="overflow-hidden rounded-[1.4rem] bg-white">
          <img
            src={image}
            alt={alt}
            loading="lazy"
            className="block w-full h-auto"
          />
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  return (
    <section id="testimonials" className="section-y bg-page">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">מה הלקוחות אומרים</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          תמיד כיף לקבל
          <br />
          <span className="text-muted">פידבקים כאלה.</span>
        </h2>

        <p className="mt-6 text-lg text-ink2 leading-relaxed max-w-2xl">
          הנה צילומי מסך מתוך שיחות עם לקוחות:
        </p>

        <div className="mt-16 lg:mt-24 space-y-20 lg:space-y-28">
          {testimonials.map((t, i) => {
            const reversed = i % 2 === 1
            return (
              <article
                key={t.name}
                className="grid lg:grid-cols-12 gap-6 lg:gap-16 items-center"
              >
                {/* שם הלקוח — מוצג רק במובייל, מעל הצילום */}
                <div className="lg:hidden">
                  <div className="font-display font-bold text-ink text-lg">{t.name}</div>
                  <div className="text-sm text-muted mt-1">{t.business}</div>
                </div>

                <div
                  className={`lg:col-span-5 ${
                    reversed ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <PhoneFrame image={t.image} alt={t.alt} />
                </div>

                <div
                  className={`lg:col-span-7 ${
                    reversed ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <blockquote className="text-2xl sm:text-3xl lg:text-[40px] font-bold font-display text-ink leading-[1.2] tracking-tight">
                    {t.quote}
                  </blockquote>
                  {/* שם הלקוח בדסקטופ — מוצג מתחת לציטוט */}
                  <div className="hidden lg:block mt-8 pt-5 border-t border-line">
                    <div className="font-display font-bold text-ink text-lg">{t.name}</div>
                    <div className="text-sm text-muted mt-1">{t.business}</div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
