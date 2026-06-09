const benefits = [
  {
    title: 'דף שמייצג את העסק שלך בכבוד',
    body:
      'לא תבנית גנרית שנראית כמו עוד אתר. דף שנבנה סביב העסק שלך, השירותים שלך והלקוחות שלך.',
  },
  {
    title: 'מותאם לטלפון',
    body:
      'רוב האנשים יראו את הדף מהנייד. לכן כל דף שאני בונה מתוכנן קודם כל למסך הטלפון.',
  },
  {
    title: 'דרך פשוטה ליצור איתך קשר',
    body:
      'כפתור וואטסאפ, טופס השארת פרטים וכל מה שצריך כדי שללקוח יהיה קל לפנות.',
  },
  {
    title: 'תהליך פשוט ומהיר',
    body:
      'בלי שאלונים אינסופיים ובלי כאב ראש. שיחה קצרה, כמה חומרים בסיסיים, ואני מטפל בכל השאר.',
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="section-y bg-page">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">ההצעה</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          מה תקבל?
        </h2>

        <div className="mt-16 lg:mt-20 grid sm:grid-cols-2 gap-x-10 gap-y-12 lg:gap-x-16 lg:gap-y-14">
          {benefits.map((b) => (
            <div key={b.title} className="border-t border-line pt-8 group">
              <h3 className="text-2xl sm:text-[28px] font-bold font-display text-ink tracking-tight group-hover:text-gold transition-colors duration-300">
                {b.title}
              </h3>
              <p className="mt-4 text-lg text-ink2 leading-relaxed max-w-xl">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
