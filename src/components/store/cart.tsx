'use client'

import Link from 'next/link'
import { createContext, use, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { PublicProduct } from '@/lib/types'

export type CartLine = { productId: string; quantity: number; name: string; price_agorot: number; image: string | null; slug: string }

type CartContextValue = {
  lines: CartLine[]
  count: number
  ready: boolean
  add: (product: PublicProduct, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const MAX_QTY = 99

function storageKey(slug: string) {
  return `dukan-cart:${slug}`
}

function readCart(slug: string): CartLine[] {
  try {
    const raw = window.localStorage.getItem(storageKey(slug))
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : []
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === 'string' && l.quantity > 0) : []
  } catch {
    return []
  }
}

const subscribeHydration = () => () => {}

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false)
  const [lines, setLines] = useState<CartLine[] | null>(null)
  const current = lines ?? (hydrated ? readCart(slug) : [])

  const persist = useCallback(
    (next: CartLine[]) => {
      setLines(next)
      try {
        window.localStorage.setItem(storageKey(slug), JSON.stringify(next))
      } catch {
        // storage unavailable (private mode); the cart still works for this page view
      }
    },
    [slug],
  )

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(slug)) setLines(readCart(slug))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [slug])

  const value = useMemo<CartContextValue>(
    () => ({
      lines: current,
      ready: hydrated,
      count: current.reduce((n, l) => n + l.quantity, 0),
      add(product, quantity = 1) {
        const existing = current.find((l) => l.productId === product.id)
        const image = product.images[0]?.path ?? null
        persist(
          existing
            ? current.map((l) => (l.productId === product.id ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
            : [...current, { productId: product.id, quantity: Math.min(MAX_QTY, quantity), name: product.name, price_agorot: product.price_agorot, image, slug: product.slug }],
        )
      },
      setQuantity(productId, quantity) {
        persist(current.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)))
      },
      remove(productId) {
        persist(current.filter((l) => l.productId !== productId))
      },
      clear() {
        persist([])
      },
    }),
    [current, hydrated, persist],
  )

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart() {
  const ctx = use(CartContext)
  if (!ctx) throw new Error('useCart outside CartProvider')
  return ctx
}

export function CartButton({ href, className }: { href: string; className?: string }) {
  const { count, ready } = useCart()
  return (
    <Link href={href} className={cn('st-cart-button relative inline-flex items-center gap-2', className)} aria-label={`עגלת קניות, ${count} פריטים`}>
      <ShoppingBag className="size-5" aria-hidden />
      <span className="hidden text-sm font-semibold sm:inline">העגלה</span>
      {ready && count > 0 && (
        <span className="st-cart-count grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums" aria-hidden>
          {count}
        </span>
      )}
    </Link>
  )
}

export function AddToCartButton({ product, disabled, compact, className }: { product: PublicProduct; disabled?: boolean; compact?: boolean; className?: string }) {
  const { add, lines } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0
  useEffect(() => {
    if (!justAdded) return
    const t = setTimeout(() => setJustAdded(false), 1600)
    return () => clearTimeout(t)
  }, [justAdded])

  if (!product.in_stock) {
    return (
      <span className={cn('st-btn st-btn-disabled', compact && 'st-btn-compact', className)} aria-disabled>
        אזל המלאי
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(product)
        setJustAdded(true)
      }}
      className={cn('st-btn st-btn-primary', compact && 'st-btn-compact', className)}
      aria-label={compact ? `הוספת ${product.name} לעגלה` : undefined}
    >
      {compact ? <Plus className="size-5" aria-hidden /> : null}
      {!compact && (justAdded ? 'נוסף לעגלה' : inCart ? `הוספה לעגלה (${inCart} כבר בעגלה)` : 'הוספה לעגלה')}
      <span className="sr-only" aria-live="polite">
        {justAdded ? 'נוסף לעגלה' : ''}
      </span>
    </button>
  )
}

export function QuantityStepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="st-stepper inline-flex items-center" role="group" aria-label={`כמות של ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="הפחתה">
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} aria-label="הוספה">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}

/** Cart lines reconciled with the current catalog: prices and availability come from the server payload. */
export function useReconciledCart(products: PublicProduct[]) {
  const cart = useCart()
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const lines = cart.lines.map((l) => {
    const product = byId.get(l.productId)
    return {
      ...l,
      product,
      available: Boolean(product && product.in_stock),
      price_agorot: product?.price_agorot ?? l.price_agorot,
      name: product?.name ?? l.name,
      image: product?.images[0]?.path ?? l.image,
      slug: product?.slug ?? l.slug,
    }
  })
  const valid = lines.filter((l) => l.available)
  const total = valid.reduce((sum, l) => sum + l.price_agorot * l.quantity, 0)
  return { ...cart, lines, valid, total }
}

export function CartView({ products, basePath, canOrder, closedMessage }: { products: PublicProduct[]; basePath: string; canOrder: boolean; closedMessage?: string }) {
  const { lines, valid, total, ready, setQuantity, remove } = useReconciledCart(products)
  if (!ready) return <div className="h-48" aria-busy />
  if (lines.length === 0) {
    return (
      <div className="st-empty py-16 text-center">
        <ShoppingBag className="mx-auto size-10 opacity-40" aria-hidden />
        <h2 className="st-display mt-4 text-2xl">העגלה עדיין ריקה</h2>
        <p className="st-muted mt-2">בחרו מוצרים מהחנות והם יחכו כאן.</p>
        <Link href={basePath} className="st-btn st-btn-primary mt-6 inline-flex">
          לכל המוצרים
        </Link>
      </div>
    )
  }
  const unavailable = lines.length - valid.length
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <ul className="st-divide" aria-label="פריטים בעגלה">
        {lines.map((l) => (
          <li key={l.productId} className={cn('flex gap-4 py-5', !l.available && 'opacity-60')}>
            <Link href={`${basePath}/products/${l.slug}`} className="st-thumb block size-24 shrink-0 overflow-hidden">
              {l.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(l.image, 'thumb')!} alt={l.name} className="size-full object-cover" loading="lazy" />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <Link href={`${basePath}/products/${l.slug}`} className="font-semibold hover:underline">
                  {l.name}
                </Link>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(l.price_agorot * l.quantity)}</span>
              </div>
              {l.available ? (
                <p className="st-muted text-sm tabular-nums">{formatPrice(l.price_agorot)} ליחידה</p>
              ) : (
                <p className="text-sm font-semibold text-[#b42318]">המוצר כבר לא זמין ולא ייכלל בהזמנה</p>
              )}
              <div className="mt-auto flex items-center justify-between gap-3">
                {l.available ? <QuantityStepper value={l.quantity} onChange={(v) => setQuantity(l.productId, v)} label={l.name} /> : <span />}
                <button type="button" onClick={() => remove(l.productId)} className="st-muted inline-flex items-center gap-1 text-sm hover:underline">
                  <Trash2 className="size-4" aria-hidden />
                  הסרה
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="st-summary h-fit p-6">
        <h2 className="text-lg font-semibold">סיכום</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="st-muted">פריטים</dt>
            <dd className="tabular-nums">{valid.reduce((n, l) => n + l.quantity, 0)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--st-line)] pt-3 text-base font-semibold">
            <dt>סה״כ לתשלום</dt>
            <dd className="tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="st-muted mt-3 text-xs">איסוף עצמי. התשלום מתבצע מול העסק ולא באתר.</p>
        {unavailable > 0 && <p className="mt-3 text-sm">{unavailable} פריטים לא זמינים יוסרו מההזמנה.</p>}
        {canOrder ? (
          valid.length > 0 ? (
            <Link href={`${basePath}/checkout`} className="st-btn st-btn-primary mt-5 flex w-full">
              להמשך ההזמנה
            </Link>
          ) : null
        ) : (
          <p className="st-notice mt-5 p-3 text-sm">{closedMessage}</p>
        )}
      </aside>
    </div>
  )
}
