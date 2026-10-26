'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TemplateKey } from '@/lib/themes'
import type { PublicImage, PublicProduct } from '@/lib/types'
import { QuantityStepper, useCart } from './cart'
import { StoreImage } from './store-image'

export function Gallery({ images, name, template }: { images: PublicImage[]; name: string; template: TemplateKey }) {
  const [index, setIndex] = useState(0)
  const current = images[index]
  return (
    <div>
      <div className={cn('st-card-media', template === 'boutique' ? 'aspect-[4/5]' : 'aspect-square', template === 'bold' && 'border-2 border-[var(--st-text)]')}>
        {current ? (
          <StoreImage image={current} alt={name} sizes="(min-width: 768px) 50vw, 100vw" priority />
        ) : (
          <div className="grid size-full place-items-center opacity-50">{name}</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="תמונות נוספות">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`תמונה ${i + 1} מתוך ${images.length}`}
              aria-pressed={i === index}
              className={cn('st-thumb size-18 shrink-0 overflow-hidden border-2 transition-colors', i === index ? 'border-[var(--st-primary)]' : 'border-transparent opacity-80 hover:opacity-100')}
            >
              <StoreImage image={img} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BuyBox({ product, canOrder, cartHref }: { product: PublicProduct; canOrder: boolean; cartHref: string }) {
  const { add, lines } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0

  if (!product.in_stock) return <p className="st-notice inline-block px-4 py-3 font-semibold">אזל מהמלאי כרגע</p>
  if (!canOrder) return <p className="st-notice inline-block px-4 py-3 text-sm">אי אפשר להזמין כרגע דרך האתר.</p>
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} label={product.name} />
        <button
          type="button"
          className="st-btn st-btn-primary flex-1 sm:flex-none"
          onClick={() => {
            add(product, qty)
            setAdded(true)
            setQty(1)
          }}
        >
          הוספה לעגלה
        </button>
      </div>
      <div aria-live="polite">
        {added && (
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Check className="size-4" aria-hidden />
            נוסף לעגלה{inCart ? ` (${inCart} בעגלה)` : ''}.
            <Link href={cartHref} className="underline underline-offset-4">
              מעבר לעגלה
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
