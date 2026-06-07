import { config, whatsappLink } from '../config'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-page border-t border-line">
      <div className="container-page py-12 sm:py-16">
        <div className="grid sm:grid-cols-12 gap-10 items-end">
          <div className="sm:col-span-6">
            <div className="font-display font-bold text-ink text-2xl tracking-tight">
              {config.ownerName}
            </div>
            <div className="text-sm text-muted mt-2">דפי נחיתה לעסקים בישראל</div>
          </div>

          <nav
            className="sm:col-span-6 sm:text-end flex flex-wrap sm:justify-end items-center gap-x-6 gap-y-2 text-sm"
            aria-label="קישורי פוטר"
          >
            <a href="#offer" className="text-ink2 hover:text-gold underline-grow transition-colors">
              ההצעה
            </a>
            <a href="#portfolio" className="text-ink2 hover:text-gold underline-grow transition-colors">
              עבודות
            </a>
            <a href="#faq" className="text-ink2 hover:text-gold underline-grow transition-colors">
              שאלות
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink2 hover:text-gold underline-grow transition-colors"
            >
              וואטסאפ
            </a>
            <a
              href={`mailto:${config.email}`}
              className="text-ink2 hover:text-gold underline-grow transition-colors"
            >
              מייל
            </a>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <div>© {year} {config.ownerName}. כל הזכויות שמורות.</div>
          <div>{config.ownerLocation}</div>
        </div>
      </div>
    </footer>
  )
}
