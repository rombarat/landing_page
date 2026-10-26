'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, Package, ReceiptText } from 'lucide-react'
import { shareOnWhatsappLink } from '@/lib/format'
import { LinkButton } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'

export function PublishedSuccess({ url, storeName, published, trialNote }: { url: string; storeName: string; published: boolean; trialNote: string | null }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, url })
        return
      } catch {
        // dismissed: fall back to WhatsApp link
      }
    }
    window.open(shareOnWhatsappLink(`החנות של ${storeName} פתוחה להזמנות: ${url}`), '_blank', 'noopener')
  }

  if (!published) return <Notice tone="warning">החנות עדיין לא פורסמה.</Notice>

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="animate-pop mx-auto inline-flex">
        <span className="price-tag text-lg">פתוח</span>
      </div>
      <h1 className="mt-6 font-display text-display-sm sm:text-display">החנות של {storeName} באוויר</h1>
      <p className="mt-3 text-lg text-muted">כל מי שיש לו את הקישור יכול להזמין עכשיו. {trialNote}</p>

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-line-strong bg-surface p-2 ps-4">
        <span className="ltr min-w-0 flex-1 truncate text-start font-medium text-tchelet-deep" data-testid="store-url">
          {url}
        </span>
        <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-soft">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'הועתק' : 'העתקה'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-turmeric font-semibold text-ink shadow-press hover:bg-turmeric-deep">
          <ExternalLink className="size-5" aria-hidden />
          פתיחת החנות
        </a>
        <button type="button" onClick={share} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface font-semibold hover:border-ink">
          <MessageCircle className="size-5" aria-hidden />
          שיתוף בוואטסאפ
        </button>
      </div>

      <div className="mt-10 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
        <LinkButton href="/dashboard/products" variant="outline" icon={<Package className="size-5" aria-hidden />}>
          ניהול מוצרים
        </LinkButton>
        <LinkButton href="/dashboard/orders" variant="outline" icon={<ReceiptText className="size-5" aria-hidden />}>
          צפייה בהזמנות
        </LinkButton>
      </div>
    </div>
  )
}
