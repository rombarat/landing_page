import Link from 'next/link'
import { AtSign, Camera, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import './fonts'
import { cn } from '@/lib/cn'
import { formatPhone, whatsappLink } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { storeCssVars } from '@/lib/themes'
import type { StorePayload } from '@/lib/types'
import { CartButton, CartProvider } from './cart'

export const ORDER_GATE_MESSAGE: Record<string, string> = {
  paused: 'החנות לא מקבלת הזמנות חדשות כרגע. אפשר ליצור קשר עם העסק ישירות.',
  subscription_inactive: 'החנות לא מקבלת הזמנות חדשות כרגע. אפשר ליצור קשר עם העסק ישירות.',
  not_published: 'זו תצוגה מקדימה. אחרי הפרסום לקוחות יוכלו להזמין.',
  suspended: 'החנות לא זמינה כרגע.',
}

export function StoreShell({ payload, basePath, preview, children }: { payload: StorePayload; basePath: string; preview?: boolean; children: React.ReactNode }) {
  const { store, settings } = payload
  const vars = storeCssVars(settings)
  const logo = mediaUrl(store.logo_path, 'thumb')
  const tpl = settings.template
  const wa = whatsappLink(store.whatsapp)
  return (
    <CartProvider slug={store.slug}>
      <div className={cn('st-root', `tpl-${tpl}`)} style={vars as React.CSSProperties}>
        {preview && (
          <div className="bg-[#1b1f3b] px-4 py-2 text-center text-sm text-white">תצוגה מקדימה של החנות שלך. לקוחות יראו אותה אחרי הפרסום.</div>
        )}
        {!preview && payload.order_gate !== 'ok' && (
          <div className="st-notice rounded-none! px-4 py-2.5 text-center text-sm font-medium" role="status">
            {ORDER_GATE_MESSAGE[payload.order_gate]}
          </div>
        )}
        <header className="st-header">
          <div className={cn('mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6', tpl === 'boutique' ? 'h-20 justify-center' : 'h-16 sm:h-18')}>
            {tpl === 'boutique' && (
              <nav className="absolute start-4 hidden items-center gap-5 text-sm sm:flex sm:start-6" aria-label="ניווט בחנות">
                <Link href={`${basePath}/catalog`} className="hover:underline">
                  כל המוצרים
                </Link>
                <Link href={`${basePath}#about`} className="hover:underline">
                  עלינו
                </Link>
              </nav>
            )}
            <Link href={basePath} className="flex min-w-0 items-center gap-3">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className={cn('size-10 shrink-0 object-cover', tpl === 'bold' ? '' : 'rounded-full')} />
              )}
              <span className="st-brand st-display truncate leading-none">{store.name}</span>
            </Link>
            <div className={cn('flex items-center gap-2', tpl === 'boutique' ? 'absolute end-4 sm:end-6' : 'ms-auto')}>
              {tpl === 'artisan' && wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-full border border-[var(--st-line)] px-3 py-2 text-sm font-medium sm:inline-flex">
                  <MessageCircle className="size-4" aria-hidden />
                  וואטסאפ
                </a>
              )}
              {tpl !== 'boutique' && (
                <Link href={`${basePath}/catalog`} className="hidden px-2 text-sm font-semibold hover:underline sm:inline">
                  כל המוצרים
                </Link>
              )}
              <CartButton href={`${basePath}/cart`} className="rounded-full px-3 py-2 hover:bg-black/5" />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <StoreFooter payload={payload} />
      </div>
    </CartProvider>
  )
}

export function ContactList({ payload, className }: { payload: StorePayload; className?: string }) {
  const { store, settings } = payload
  const wa = whatsappLink(store.whatsapp, `שלום, הגעתי מהחנות של ${store.name}`)
  return (
    <ul className={cn('space-y-3 text-sm', className)}>
      {store.phone && (
        <li>
          <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 hover:underline">
            <Phone className="size-4 shrink-0" aria-hidden />
            <span className="ltr">{formatPhone(store.phone)}</span>
          </a>
        </li>
      )}
      {wa && (
        <li>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
            <MessageCircle className="size-4 shrink-0" aria-hidden />
            שליחת הודעה בוואטסאפ
          </a>
        </li>
      )}
      {store.instagram && (
        <li>
          <a href={`https://instagram.com/${store.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
            <Camera className="size-4 shrink-0" aria-hidden />
            <span className="ltr">@{store.instagram}</span>
          </a>
        </li>
      )}
      {store.contact_email && (
        <li>
          <a href={`mailto:${store.contact_email}`} className="inline-flex items-center gap-2 hover:underline">
            <AtSign className="size-4 shrink-0" aria-hidden />
            <span className="ltr">{store.contact_email}</span>
          </a>
        </li>
      )}
      {settings.pickup_address && (
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>איסוף עצמי: {settings.pickup_address}</span>
        </li>
      )}
      {settings.pickup_requires_slot && settings.pickup_lead_hours > 0 && (
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>מזמינים לפחות {settings.pickup_lead_hours} שעות מראש</span>
        </li>
      )}
    </ul>
  )
}

function StoreFooter({ payload }: { payload: StorePayload }) {
  const { store } = payload
  return (
    <footer className="mt-20 border-t border-[var(--st-line)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6">
        <div>
          <p className="st-display text-2xl">{store.name}</p>
        </div>
        <ContactList payload={payload} />
      </div>
      <div className="st-muted mx-auto max-w-6xl px-4 pb-8 text-xs sm:px-6">
        <Link href="/" className="hover:underline">
          החנות נבנתה בדוכן
        </Link>
      </div>
    </footer>
  )
}
