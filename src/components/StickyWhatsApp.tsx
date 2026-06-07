import { WhatsAppIcon } from './icons'
import { whatsappLink } from '../config'

export function StickyWhatsApp() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="פנייה בוואטסאפ"
      className="
        fixed bottom-5 left-5 z-50
        inline-flex items-center gap-2.5
        h-14 px-6 rounded-full
        bg-wa text-page font-display font-semibold text-[15px]
        shadow-[0_10px_30px_-5px_rgba(37,211,102,0.4)]
        hover:bg-waDark active:translate-y-[1px]
        transition-all duration-200
        cursor-pointer
      "
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span className="hidden sm:inline">שיחה בוואטסאפ</span>
    </a>
  )
}
