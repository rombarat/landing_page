import { LinkButton } from './ui/Button'
import { WhatsAppIcon } from './icons'
import { whatsappLink, config } from '../config'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-page/85 backdrop-blur border-b border-line">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          <a href="#main" className="flex items-baseline gap-3 cursor-pointer">
            <span className="font-display font-bold text-ink text-[18px] tracking-tight">
              {config.ownerName}
            </span>
            <span className="hidden sm:inline text-sm text-muted">— דפי נחיתה</span>
          </a>

          <LinkButton
            href={whatsappLink()}
            variant="whatsapp"
            size="md"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 text-sm"
          >
            <WhatsAppIcon className="h-4 w-4" />
            בוואטסאפ
          </LinkButton>
        </div>
      </div>
    </header>
  )
}
