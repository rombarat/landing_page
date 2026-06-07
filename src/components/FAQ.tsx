import { useState } from 'react'
import { ChevronDownIcon } from './icons'
import { config } from '../config'

const items = [
  {
    q: `מה כולל המחיר של ${config.launchPrice}?`,
    a: 'דף נחיתה שלם, מותאם לנייד, עיצוב מותאם לעסק שלכם, כפתור וואטסאפ עם הודעה מוכנה, טופס לידים, חיבור לדומיין שלכם והעלאה לאוויר. כולל עד 2 סבבי תיקונים.',
  },
  {
    q: 'מה אתם צריכים ממני כדי להתחיל?',
    a: 'לוגו, תמונות של העסק (אם יש), וזמינות לשיחה של רבע שעה. את שאר הניסוחים והטקסטים אני יכול לכתוב בעצמי.',
  },
  {
    q: 'באמת מסיימים תוך 3 ימי עסקים?',
    a: 'בהחלט. מרגע קבלת החומרים, השעון מתחיל לתקתק. בכוונה אני לא מקבל יותר מדי פרויקטים במקביל כדי לעמוד בזמנים.',
  },
  {
    q: 'מה קורה אם הדף לא מוצא חן בעיני?',
    a: 'בשביל זה יש שני סבבי תיקונים — אנחנו עוברים יחד על הדף ואתם אומרים מה לדייק עד שיוצאים מרוצים. אם בכל זאת לא מתחברים, לא משלמים על מה שלא קיבלתם.',
  },
  {
    q: 'הדף שייך לי? אפשר לעזוב אותך בעתיד?',
    a: 'לגמרי. הדף נבנה על מערכת שהיא שלכם וניתנת להעברה. הקוד, הדומיין והתוכן — הכל על שמכם. אם תרצו לעבור, אני אעזור להעביר בלי בלאגן.',
  },
  {
    q: 'יש עלויות נוספות?',
    a: 'רק עלות הדומיין (כ־50₪ בשנה) והאחסון השנתי בחברה שתבחרו. יש גם אפשרויות חינמיות שמתאימות לדף נחיתה — אסביר בדיוק במה כדאי לבחור, ולמה.',
  },
]

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="section-y bg-page">
      <div className="container-page">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-5">
            <div className="gold-rule">
              <span className="text-sm text-gold font-display font-medium">שאלות נפוצות</span>
            </div>
            <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter">
              דברים שכמעט כולם
              <br />
              <span className="text-muted">שואלים אותי.</span>
            </h2>
            <p className="mt-6 text-lg text-ink2 leading-relaxed max-w-md">
              נשארה שאלה פתוחה? שלחו וואטסאפ — לרוב אני עונה תוך שעה־שעתיים.
            </p>
          </div>

          <div className="lg:col-span-7 border-y border-line">
            {items.map((item, i) => {
              const isOpen = openIdx === i
              return (
                <div
                  key={item.q}
                  className={i > 0 ? 'border-t border-line' : ''}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-baseline justify-between gap-4 py-6 text-start cursor-pointer group"
                  >
                    <span
                      className={`text-[17px] sm:text-[19px] font-semibold transition-colors duration-200 ${
                        isOpen ? 'text-gold' : 'text-ink group-hover:text-gold'
                      }`}
                    >
                      {item.q}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                        isOpen ? 'rotate-180 text-gold' : 'text-muted group-hover:text-ink'
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-ink2 leading-relaxed max-w-2xl">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
