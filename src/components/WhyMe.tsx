const values = [
  {
    title: 'קודם כל מובייל',
    body:
      'רוב הלקוחות שלך גולשים מהטלפון. הדפים שלי נבנים מתוך מחשבה על הנייד, ורק אז מותאמים למחשב.',
  },
  {
    title: 'מהירות שיא',
    body:
      'דף קל ונקי שעולה מהר גם בחיבור אינטרנט חלש. כל שנייה של המתנה היא לקוח פוטנציאלי שעוזב.',
  },
  {
    title: 'עבודה ישירה מולי',
    body:
      'בלי סוכנויות, מנהלי פרויקטים או טלפון שבור. מדברים איתי ישירות, מקבלים תשובות ממני.',
  },
  {
    title: 'תוצאות לפני הכל',
    body:
      'עיצוב יפה זה חשוב, אבל דף נחיתה חייב להיות גם ברור וממוקד כדי לגרום ללקוח להשאיר פרטים. ככה בדיוק אני בונה אותם.',
  },
]

export function WhyMe() {
  return (
    <section id="why" className="section-y bg-surface border-y border-line">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">למה לעבוד איתי</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          תכל׳ס.
          <br />
          <span className="text-muted">פשוט וממוקד תוצאות.</span>
        </h2>

        <div className="mt-16 lg:mt-20 grid sm:grid-cols-2 gap-x-10 gap-y-12">
          {values.map((v) => (
            <div key={v.title} className="border-t border-line pt-8 group">
              <h3 className="text-2xl sm:text-[28px] font-bold font-display text-ink tracking-tight group-hover:text-gold transition-colors duration-300">
                {v.title}
              </h3>
              <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-xl">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
