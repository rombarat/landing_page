import { ExternalLinkIcon } from './icons'

const projects = [
  {
    name: 'טעמי שמחה',
    category: 'קייטרינג בשרי מהודר',
    image: '/images/simcha.png',
    url: 'https://simcha-keitering.vercel.app/',
  },
  {
    name: 'קונים רכבים',
    category: 'קניית רכבים יד שנייה',
    image: '/images/ishai.png',
    url: 'https://yishai-cars.com/',
  },
  {
    name: 'TLV Young',
    category: 'קהילה לצעירים בתל אביב',
    image: '/images/yael.png',
    url: 'https://yael-website.vercel.app/',
  },
  {
    name: 'אניס מטבחים',
    category: 'מטבחי יוקרה בהתאמה אישית',
    image: '/images/anis.png',
    url: 'https://anis-kitchens.vercel.app/',
  },
]

export function Portfolio() {
  return (
    <section id="portfolio" className="section-y bg-surface border-y border-line">
      <div className="container-page">
        <div className="gold-rule">
          <span className="text-sm text-gold font-display font-medium">העבודות האחרונות שלי</span>
        </div>

        <h2 className="mt-6 text-huge font-bold font-display leading-[1.03] tracking-tighter max-w-4xl">
          לא רק הבטחות.
          <br />
          <span className="text-muted">לחצו ותראו איך זה נראה במציאות.</span>
        </h2>

        <div className="mt-16 lg:mt-20 grid gap-10 lg:gap-14 sm:grid-cols-2">
          {projects.map((p, i) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block ${
                i % 2 === 0 ? 'sm:translate-y-0' : 'sm:translate-y-10'
              }`}
              aria-label={`${p.name} — פתיחה בכרטיסייה חדשה`}
            >
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight truncate">
                    {p.name}
                  </h3>
                  <div className="text-sm text-muted mt-1 truncate">{p.category}</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-sm text-ink2 group-hover:text-gold transition-colors">
                  צפייה
                  <ExternalLinkIcon className="h-4 w-4" />
                </span>
              </div>

              <div className="relative overflow-hidden bg-page border border-line rounded-lg group-hover:border-gold/40 transition-colors duration-500" style={{ aspectRatio: '16 / 10' }}>
                <img
                  src={p.image}
                  alt={`צילום מסך של דף הנחיתה של ${p.name}`}
                  className="absolute inset-0 block h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
