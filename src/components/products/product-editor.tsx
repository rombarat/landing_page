'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  CloudUpload,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  Loader2,
  PackageX,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  bulkUpdateProducts,
  createCategory,
  deleteImage,
  deleteProducts,
  duplicateProduct,
  mergeProducts,
  reorderImages,
  reorderProducts,
  setProductsStatus,
  updateProduct,
  type ProductPatch,
} from '@/lib/actions/products'
import { suggestProductDetails } from '@/lib/actions/ai'
import { createQueue, uploadImage, type UploadedImage } from '@/lib/client/upload'
import { cn } from '@/lib/cn'
import type { EditorCategory, EditorProduct } from '@/lib/data/merchant'
import { agorotToInput, formatPrice, parsePriceToAgorot } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import type { ProductStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type PendingUpload = { key: string; file: File; previewUrl: string; state: 'queued' | 'uploading' | 'error'; error?: string }

type Card = {
  key: string
  productId: string | null
  name: string
  priceInput: string
  description: string
  categoryId: string | null
  status: ProductStatus
  inStock: boolean
  featured: boolean
  images: UploadedImage[]
  /** Photo that is creating this product (first upload). */
  creating?: PendingUpload
  /** Extra photos being added to an existing product. */
  adding: PendingUpload[]
  save: SaveState
  saveError?: string
  priceError?: string
  showDescription: boolean
}

function toCard(p: EditorProduct): Card {
  return {
    key: p.id,
    productId: p.id,
    name: p.name,
    priceInput: agorotToInput(p.price_agorot),
    description: p.description,
    categoryId: p.category_id,
    status: p.status,
    inStock: p.in_stock,
    featured: p.is_featured,
    images: p.images,
    adding: [],
    save: 'idle',
    showDescription: p.description.length > 0,
  }
}

const isComplete = (c: Card) => c.name.trim().length > 0 && parsePriceToAgorot(c.priceInput) != null

type Props = {
  initialProducts: EditorProduct[]
  initialCategories: EditorCategory[]
  mode: 'onboarding' | 'dashboard'
  aiEnabled: boolean
  footer?: (summary: { ready: number; incomplete: number; uploading: number; total: number }) => React.ReactNode
}

export function ProductEditor({ initialProducts, initialCategories, mode, aiEnabled, footer }: Props) {
  const [cards, setCards] = useState<Card[]>(() => initialProducts.map(toCard))
  const [categories, setCategories] = useState(initialCategories)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ tone: 'danger' | 'success' | 'info'; text: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'hidden'>('all')
  const [busy, startBusy] = useTransition()
  const queue = useRef(createQueue(3))
  const inputRef = useRef<HTMLInputElement>(null)
  const cardsRef = useRef(cards)
  cardsRef.current = cards

  const patchCard = useCallback((key: string, patch: Partial<Card> | ((c: Card) => Partial<Card>)) => {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c)))
  }, [])

  // Warn before leaving while uploads are still running.
  const uploading = cards.filter((c) => c.creating || c.adding.length > 0).length
  useEffect(() => {
    if (!uploading) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [uploading])

  const runCreate = useCallback(
    (key: string, pending: PendingUpload) => {
      patchCard(key, { creating: { ...pending, state: 'queued', error: undefined } })
      void queue.current(async () => {
        patchCard(key, (c) => ({ creating: c.creating && { ...c.creating, state: 'uploading' } }))
        try {
          const res = await uploadImage(pending.file, 'product')
          if (res.type !== 'product') return
          URL.revokeObjectURL(pending.previewUrl)
          patchCard(key, { productId: res.productId, images: [res.image], creating: undefined })
        } catch (e) {
          patchCard(key, (c) => ({ creating: c.creating && { ...c.creating, state: 'error', error: (e as Error).message } }))
        }
      })
    },
    [patchCard],
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
      if (list.length === 0) {
        setMessage({ tone: 'danger', text: 'לא נמצאו תמונות בקבצים שנבחרו.' })
        return
      }
      setMessage(null)
      const fresh: Card[] = list.map((file) => {
        const key = `new-${crypto.randomUUID()}`
        return {
          key,
          productId: null,
          name: '',
          priceInput: '',
          description: '',
          categoryId: null,
          status: 'draft',
          inStock: true,
          featured: false,
          images: [],
          creating: { key, file, previewUrl: URL.createObjectURL(file), state: 'queued' },
          adding: [],
          save: 'idle',
          showDescription: false,
        }
      })
      setCards((prev) => [...prev, ...fresh])
      fresh.forEach((c) => runCreate(c.key, c.creating!))
    },
    [runCreate],
  )

  const addPhotos = useCallback(
    (card: Card, files: FileList) => {
      if (!card.productId) return
      const productId = card.productId
      const room = 8 - card.images.length - card.adding.length
      const list = [...files].slice(0, Math.max(0, room))
      if (list.length < files.length) setMessage({ tone: 'info', text: 'אפשר עד 8 תמונות למוצר.' })
      for (const file of list) {
        const pending: PendingUpload = { key: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), state: 'uploading' }
        patchCard(card.key, (c) => ({ adding: [...c.adding, pending] }))
        void queue.current(async () => {
          try {
            const res = await uploadImage(file, 'product-image', productId)
            if (res.type !== 'product-image') return
            URL.revokeObjectURL(pending.previewUrl)
            patchCard(card.key, (c) => ({ images: [...c.images, res.image], adding: c.adding.filter((a) => a.key !== pending.key) }))
          } catch (e) {
            patchCard(card.key, (c) => ({ adding: c.adding.map((a) => (a.key === pending.key ? { ...a, state: 'error', error: (e as Error).message } : a)) }))
          }
        })
      }
    },
    [patchCard],
  )

  const save = useCallback(
    async (key: string, patch: ProductPatch) => {
      const card = cardsRef.current.find((c) => c.key === key)
      if (!card?.productId) return
      patchCard(key, { save: 'saving', saveError: undefined })
      const res = await updateProduct(card.productId, patch)
      if (res.ok) patchCard(key, { save: 'saved', status: res.data!.status })
      else patchCard(key, { save: 'error', saveError: res.error })
    },
    [patchCard],
  )

  const commitPrice = (card: Card) => {
    if (card.priceInput.trim() === '') {
      patchCard(card.key, { priceError: undefined })
      void save(card.key, { price_agorot: null })
      return
    }
    const agorot = parsePriceToAgorot(card.priceInput)
    if (agorot == null) {
      patchCard(card.key, { priceError: 'מחיר לא תקין' })
      return
    }
    patchCard(card.key, { priceError: undefined, priceInput: agorotToInput(agorot) })
    void save(card.key, { price_agorot: agorot })
  }

  const removeCards = (keys: string[]) => {
    const targets = cardsRef.current.filter((c) => keys.includes(c.key))
    const ids = targets.map((c) => c.productId).filter((id): id is string => Boolean(id))
    setCards((prev) => prev.filter((c) => !keys.includes(c.key)))
    setSelected(new Set())
    targets.forEach((c) => c.creating && URL.revokeObjectURL(c.creating.previewUrl))
    if (ids.length)
      startBusy(async () => {
        const res = await deleteProducts(ids)
        if (!res.ok) setMessage({ tone: 'danger', text: res.error })
      })
  }

  const move = (key: string, dir: -1 | 1) => {
    const idx = cards.findIndex((c) => c.key === key)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= cards.length) return
    const next = [...cards]
    ;[next[idx], next[target]] = [next[target]!, next[idx]!]
    setCards(next)
    const ids = next.map((c) => c.productId).filter((id): id is string => Boolean(id))
    startBusy(async () => {
      await reorderProducts(ids)
    })
  }

  const makePrimary = (card: Card, imageId: string) => {
    if (!card.productId) return
    const images = [card.images.find((i) => i.id === imageId)!, ...card.images.filter((i) => i.id !== imageId)]
    patchCard(card.key, { images })
    startBusy(async () => {
      await reorderImages(card.productId!, images.map((i) => i.id))
    })
  }

  const removeImage = (card: Card, imageId: string) => {
    patchCard(card.key, { images: card.images.filter((i) => i.id !== imageId) })
    startBusy(async () => {
      const res = await deleteImage(imageId)
      if (!res.ok) setMessage({ tone: 'danger', text: res.error })
    })
  }

  const selectedCards = cards.filter((c) => selected.has(c.key) && c.productId)
  const selectedIds = selectedCards.map((c) => c.productId!)

  const merge = () => {
    const [target, ...rest] = selectedCards
    if (!target || rest.length === 0) return
    const total = selectedCards.reduce((n, c) => n + c.images.length, 0)
    if (total > 8) {
      setMessage({ tone: 'danger', text: 'אפשר לאחד עד 8 תמונות למוצר אחד.' })
      return
    }
    startBusy(async () => {
      const res = await mergeProducts(target.productId!, rest.map((c) => c.productId!))
      if (!res.ok) {
        setMessage({ tone: 'danger', text: res.error })
        return
      }
      const restKeys = new Set(rest.map((c) => c.key))
      setCards((prev) =>
        prev
          .filter((c) => !restKeys.has(c.key))
          .map((c) =>
            c.key === target.key
              ? {
                  ...c,
                  images: [...c.images, ...rest.flatMap((r) => r.images)],
                  name: c.name || rest.find((r) => r.name)?.name || '',
                  priceInput: c.priceInput || rest.find((r) => r.priceInput)?.priceInput || '',
                }
              : c,
          ),
      )
      setSelected(new Set())
      setMessage({ tone: 'success', text: `${selectedCards.length} התמונות אוחדו למוצר אחד.` })
    })
  }

  const bulkStatus = (status: 'active' | 'hidden' | 'archived') =>
    startBusy(async () => {
      const res = await setProductsStatus(selectedIds, status)
      if (!res.ok) return setMessage({ tone: 'danger', text: res.error })
      const skipped = res.data?.skipped ?? 0
      setCards((prev) =>
        status === 'archived'
          ? prev.filter((c) => !selected.has(c.key))
          : prev.map((c) => (selected.has(c.key) && (status !== 'active' || isComplete(c)) ? { ...c, status } : c)),
      )
      setSelected(new Set())
      setMessage({
        tone: skipped ? 'info' : 'success',
        text: skipped ? `${skipped} מוצרים בלי שם או מחיר נשארו מוסתרים.` : 'המוצרים עודכנו.',
      })
    })

  const bulkCategory = (categoryId: string | null) =>
    startBusy(async () => {
      const res = await bulkUpdateProducts(selectedIds, { category_id: categoryId })
      if (!res.ok) return setMessage({ tone: 'danger', text: res.error })
      setCards((prev) => prev.map((c) => (selected.has(c.key) ? { ...c, categoryId } : c)))
      setMessage({ tone: 'success', text: 'הקטגוריה עודכנה.' })
    })

  const bulkStock = (inStock: boolean) =>
    startBusy(async () => {
      const res = await bulkUpdateProducts(selectedIds, { in_stock: inStock })
      if (!res.ok) return setMessage({ tone: 'danger', text: res.error })
      setCards((prev) => prev.map((c) => (selected.has(c.key) ? { ...c, inStock } : c)))
      setMessage({ tone: 'success', text: inStock ? 'המוצרים סומנו כזמינים.' : 'המוצרים סומנו כאזלו.' })
    })

  const bulkPrice = (percent: number) =>
    startBusy(async () => {
      const res = await bulkUpdateProducts(selectedIds, { price_percent: percent })
      if (!res.ok) return setMessage({ tone: 'danger', text: res.error })
      setCards((prev) =>
        prev.map((c) => {
          if (!selected.has(c.key)) return c
          const agorot = parsePriceToAgorot(c.priceInput)
          return agorot == null ? c : { ...c, priceInput: agorotToInput(Math.round((agorot * (100 + percent)) / 100)) }
        }),
      )
      setMessage({ tone: 'success', text: 'המחירים עודכנו.' })
    })

  const duplicate = (card: Card) =>
    startBusy(async () => {
      if (!card.productId) return
      const res = await duplicateProduct(card.productId)
      if (!res.ok) return setMessage({ tone: 'danger', text: res.error })
      const copy: Card = { ...card, key: res.data!.id, productId: res.data!.id, name: card.name ? `${card.name} (עותק)` : '', status: 'hidden', featured: false, adding: [], save: 'idle' }
      setCards((prev) => {
        const idx = prev.findIndex((c) => c.key === card.key)
        return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
      })
      setMessage({ tone: 'success', text: 'נוצר עותק מוסתר של המוצר. עדכנו אותו והציגו כשמוכן.' })
    })

  const addCategory = async (name: string): Promise<string | null> => {
    const res = await createCategory(name)
    if (!res.ok) {
      setMessage({ tone: 'danger', text: res.error })
      return null
    }
    setCategories((prev) => (prev.some((c) => c.id === res.data!.id) ? prev : [...prev, { ...res.data!, position: prev.length, product_count: 0 }]))
    return res.data!.id
  }

  const ready = cards.filter((c) => c.productId && isComplete(c)).length
  const incomplete = cards.filter((c) => !isComplete(c)).length
  const visible = useMemo(
    () =>
      cards.filter((c) =>
        filter === 'incomplete' ? !isComplete(c) : filter === 'hidden' ? c.status === 'hidden' : true,
      ),
    [cards, filter],
  )

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false)
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return
        e.preventDefault()
        setDragOver(false)
        addFiles(e.dataTransfer.files)
      }}
      className="relative"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        data-testid="product-files"
        aria-label="בחירת תמונות מוצרים"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {cards.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-150 sm:py-24',
            dragOver ? 'border-tchelet bg-tchelet-wash' : 'border-line-strong bg-surface hover:border-ink',
          )}
        >
          <span className="grid size-16 place-items-center rounded-full bg-turmeric text-ink">
            <CloudUpload className="size-8" aria-hidden />
          </span>
          <span className="mt-5 text-xl font-semibold">בוחרים תמונות של המוצרים</span>
          <span className="mt-2 max-w-sm text-muted">
            אפשר לבחור כמה תמונות בבת אחת, מהטלפון או מהמחשב, או לגרור אותן לכאן. כל תמונה הופכת לכרטיס מוצר.
          </span>
        </button>
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => inputRef.current?.click()} icon={<ImagePlus className="size-5" aria-hidden />}>
            הוספת תמונות
          </Button>
          <div className="ms-auto flex items-center gap-1 rounded-md bg-sunken p-1 text-sm" role="group" aria-label="סינון מוצרים">
            {(
              [
                ['all', `הכול (${cards.length})`],
                ['incomplete', `חסר שם או מחיר (${incomplete})`],
                ...(mode === 'dashboard' ? [['hidden', 'מוסתרים'] as const] : []),
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={cn('rounded px-3 py-1.5 font-medium', filter === key ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {dragOver && cards.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-xl border-2 border-dashed border-tchelet bg-tchelet-wash/85">
          <p className="text-xl font-semibold text-tchelet-deep">משחררים כאן כדי להוסיף מוצרים</p>
        </div>
      )}

      {message && (
        <Notice tone={message.tone} className="mb-4" action={<button type="button" onClick={() => setMessage(null)} aria-label="סגירה"><X className="size-4" /></button>}>
          {message.text}
        </Notice>
      )}

      {selectedCards.length > 0 && (
        <div className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-ink bg-ink px-3 py-2 text-white shadow-float" role="toolbar" aria-label="פעולות על מוצרים שנבחרו">
          <span className="px-1 text-sm font-semibold">{selectedCards.length} נבחרו</span>
          {selectedCards.length > 1 && (
            <button type="button" onClick={merge} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-turmeric px-3 text-sm font-semibold text-ink hover:bg-turmeric-deep">
              <Layers className="size-4" aria-hidden />
              איחוד למוצר אחד
            </button>
          )}
          {mode === 'dashboard' && (
            <>
              <BulkButton onClick={() => bulkStatus('active')} disabled={busy}>הצגה בחנות</BulkButton>
              <BulkButton onClick={() => bulkStatus('hidden')} disabled={busy}>הסתרה</BulkButton>
              <BulkButton onClick={() => bulkStock(false)} disabled={busy}>אזל</BulkButton>
              <BulkButton onClick={() => bulkStock(true)} disabled={busy}>במלאי</BulkButton>
              <select
                className="h-9 rounded-md bg-white/10 px-2 text-sm text-white"
                aria-label="שינוי קטגוריה"
                value=""
                onChange={(e) => e.target.value && bulkCategory(e.target.value === 'none' ? null : e.target.value)}
              >
                <option value="">קטגוריה…</option>
                <option value="none">בלי קטגוריה</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md bg-white/10 px-2 text-sm text-white"
                aria-label="שינוי מחיר באחוזים"
                value=""
                onChange={(e) => e.target.value && bulkPrice(Number(e.target.value))}
              >
                <option value="">מחיר…</option>
                {[5, 10, 15, 20].map((p) => (
                  <option key={p} value={p}>{`העלאה ב־${p}%`}</option>
                ))}
                {[5, 10, 20].map((p) => (
                  <option key={-p} value={-p}>{`הנחה של ${p}%`}</option>
                ))}
              </select>
              <BulkButton onClick={() => bulkStatus('archived')} disabled={busy}>העברה לארכיון</BulkButton>
            </>
          )}
          <button
            type="button"
            onClick={() => removeCards(selectedCards.map((c) => c.key))}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Trash2 className="size-4" aria-hidden />
            מחיקה
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ms-auto rounded-md p-2 hover:bg-white/10" aria-label="ביטול הבחירה">
            <X className="size-4" />
          </button>
        </div>
      )}

      {cards.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="מוצרים">
          {visible.map((card) => (
            <ProductCard
              key={card.key}
              card={card}
              index={cards.indexOf(card)}
              total={cards.length}
              mode={mode}
              aiEnabled={aiEnabled}
              categories={categories}
              selected={selected.has(card.key)}
              onSelect={(on) =>
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (on) next.add(card.key)
                  else next.delete(card.key)
                  return next
                })
              }
              onChange={(patch) => patchCard(card.key, patch)}
              onSave={(patch) => void save(card.key, patch)}
              onCommitPrice={() => commitPrice(card)}
              onRemove={() => removeCards([card.key])}
              onRetry={() => card.creating && runCreate(card.key, card.creating)}
              onMove={(dir) => move(card.key, dir)}
              onAddPhotos={(files) => addPhotos(card, files)}
              onDismissAdding={(k) => patchCard(card.key, (c) => ({ adding: c.adding.filter((a) => a.key !== k) }))}
              onMakePrimary={(id) => makePrimary(card, id)}
              onRemoveImage={(id) => removeImage(card, id)}
              onDuplicate={() => duplicate(card)}
              onAddCategory={addCategory}
            />
          ))}
        </ul>
      )}

      {footer?.({ ready, incomplete, uploading, total: cards.length })}
    </div>
  )
}

function BulkButton({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button type="button" className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50" {...props}>
      {children}
    </button>
  )
}

type CardProps = {
  card: Card
  index: number
  total: number
  mode: Props['mode']
  aiEnabled: boolean
  categories: EditorCategory[]
  selected: boolean
  onSelect: (on: boolean) => void
  onChange: (patch: Partial<Card>) => void
  onSave: (patch: ProductPatch) => void
  onCommitPrice: () => void
  onRemove: () => void
  onRetry: () => void
  onMove: (dir: -1 | 1) => void
  onAddPhotos: (files: FileList) => void
  onDismissAdding: (key: string) => void
  onMakePrimary: (imageId: string) => void
  onRemoveImage: (imageId: string) => void
  onDuplicate: () => void
  onAddCategory: (name: string) => Promise<string | null>
}

function ProductCard(props: CardProps) {
  const { card, index, total, mode, categories } = props
  const photoInput = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<{ name: string; description: string; alt: string } | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const cover = card.images[0]
  const creating = card.creating
  const disabled = !card.productId
  const complete = isComplete(card)
  const nameId = `name-${card.key}`
  const priceId = `price-${card.key}`

  const askAi = async () => {
    if (!card.productId) return
    setSuggesting(true)
    setSuggestError(null)
    const res = await suggestProductDetails(card.productId)
    setSuggesting(false)
    if (res.ok) setSuggestion(res.data!)
    else setSuggestError(res.error)
  }

  return (
    <li
      className={cn(
        'animate-pop flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors duration-150',
        props.selected ? 'border-tchelet ring-3 ring-tchelet/20' : 'border-line',
      )}
      data-testid="product-card"
    >
      <div className="relative aspect-[4/3] bg-sunken">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(cover.path, 'thumb')!} alt={cover.alt || card.name || 'תמונת מוצר'} className="size-full object-cover" />
        ) : creating ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creating.previewUrl} alt="" className={cn('size-full object-cover', creating.state !== 'error' && 'opacity-70')} />
        ) : (
          <button type="button" onClick={() => photoInput.current?.click()} className="grid size-full place-items-center text-muted hover:text-ink">
            <span className="flex flex-col items-center gap-2 text-sm font-medium">
              <ImagePlus className="size-8" aria-hidden />
              הוספת תמונה
            </span>
          </button>
        )}

        {creating && creating.state !== 'error' && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-ink/75 px-3 py-2 text-sm text-white">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {creating.state === 'queued' ? 'ממתין בתור…' : 'מעלה ומכין את התמונה…'}
          </div>
        )}
        {creating?.state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 p-4 text-center text-white" role="alert">
            <TriangleAlert className="size-6 text-turmeric" aria-hidden />
            <p className="text-sm">{creating.error}</p>
            <div className="flex gap-2">
              <button type="button" onClick={props.onRetry} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-turmeric px-3 text-sm font-semibold text-ink">
                <RotateCcw className="size-4" aria-hidden />
                לנסות שוב
              </button>
              <button type="button" onClick={props.onRemove} className="h-9 rounded-md px-3 text-sm font-semibold hover:bg-white/10">
                להסיר
              </button>
            </div>
          </div>
        )}

        {!disabled && (
          <label className="absolute start-2 top-2 grid size-9 cursor-pointer place-items-center rounded-md bg-surface/95 shadow-sm">
            <input
              type="checkbox"
              className="size-4.5 cursor-pointer accent-tchelet"
              checked={props.selected}
              onChange={(e) => props.onSelect(e.target.checked)}
              aria-label={`בחירת ${card.name || 'מוצר'}`}
            />
          </label>
        )}
        <div className="absolute end-2 top-2 flex gap-1">
          {card.status === 'hidden' && <Badge tone="neutral">מוסתר</Badge>}
          {!card.inStock && <Badge tone="warning">אזל</Badge>}
          {card.productId && !complete && card.status !== 'hidden' && <Badge tone="brand">חסר {card.name.trim() ? 'מחיר' : 'שם'}</Badge>}
        </div>
      </div>

      {(card.images.length > 1 || card.adding.length > 0 || (card.images.length > 0 && !disabled)) && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2">
          {card.images.map((img, i) => (
            <div key={img.id} className="group relative size-12 shrink-0 overflow-hidden rounded-sm bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(img.path, 'thumb')!} alt="" className="size-full object-cover" />
              {i === 0 ? (
                <span className="absolute inset-x-0 bottom-0 bg-ink/70 text-center text-[10px] font-semibold text-white">ראשית</span>
              ) : (
                <button
                  type="button"
                  onClick={() => props.onMakePrimary(img.id)}
                  className="absolute inset-0 grid place-items-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="להפוך לתמונה ראשית"
                >
                  <Star className="size-4" aria-hidden />
                </button>
              )}
              {card.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => props.onRemoveImage(img.id)}
                  className="absolute -end-0 -top-0 grid size-5 place-items-center rounded-bl-sm bg-surface text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="מחיקת התמונה"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          {card.adding.map((a) => (
            <div key={a.key} className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-sunken" title={a.error}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.previewUrl} alt="" className="size-full object-cover opacity-60" />
              <span className="absolute inset-0 grid place-items-center">
                {a.state === 'error' ? (
                  <button type="button" onClick={() => props.onDismissAdding(a.key)} aria-label={`ההעלאה נכשלה: ${a.error}. להסיר`}>
                    <TriangleAlert className="size-5 text-pomegranate" />
                  </button>
                ) : (
                  <Loader2 className="size-5 animate-spin text-ink" aria-hidden />
                )}
              </span>
            </div>
          ))}
          {!disabled && card.images.length + card.adding.length < 8 && (
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              className="grid size-12 shrink-0 place-items-center rounded-sm border border-dashed border-line-strong text-muted hover:border-ink hover:text-ink"
              aria-label="הוספת תמונה נוספת למוצר"
            >
              <ImagePlus className="size-5" aria-hidden />
            </button>
          )}
        </div>
      )}
      <input
        ref={photoInput}
        aria-label="הוספת תמונות למוצר"
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) {
            if (card.productId) props.onAddPhotos(e.target.files)
          }
          e.target.value = ''
        }}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
          <div>
            <label htmlFor={nameId} className="mb-1 block text-xs font-semibold text-muted">
              שם המוצר
            </label>
            <input
              id={nameId}
              className={cn(inputClass, 'h-11')}
              value={card.name}
              maxLength={100}
              disabled={disabled}
              placeholder="למשל: עוגת גבינה פירורים"
              onChange={(e) => props.onChange({ name: e.target.value })}
              onBlur={() => props.onSave({ name: card.name.trim() })}
            />
          </div>
          <div>
            <label htmlFor={priceId} className="mb-1 block text-xs font-semibold text-muted">
              מחיר
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-muted">₪</span>
              <input
                id={priceId}
                className={cn(inputClass, 'h-11 pl-8 text-right tabular-nums')}
                value={card.priceInput}
                inputMode="decimal"
                disabled={disabled}
                placeholder="0"
                dir="ltr"
                aria-invalid={card.priceError ? true : undefined}
                aria-describedby={card.priceError ? `${priceId}-err` : undefined}
                onChange={(e) => props.onChange({ priceInput: e.target.value, priceError: undefined })}
                onBlur={props.onCommitPrice}
              />
            </div>
            {card.priceError && (
              <p id={`${priceId}-err`} className="mt-1 text-xs font-medium text-pomegranate">
                {card.priceError}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor={`cat-${card.key}`} className="mb-1 block text-xs font-semibold text-muted">
            קטגוריה
          </label>
          {newCategory === null ? (
            <select
              id={`cat-${card.key}`}
              className={cn(inputClass, 'h-10 text-sm')}
              value={card.categoryId ?? ''}
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value === '__new') return setNewCategory('')
                const categoryId = e.target.value || null
                props.onChange({ categoryId })
                props.onSave({ category_id: categoryId })
              }}
            >
              <option value="">בלי קטגוריה</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new">+ קטגוריה חדשה</option>
            </select>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newCategory.trim()) return
                const id = await props.onAddCategory(newCategory.trim())
                setNewCategory(null)
                if (id) {
                  props.onChange({ categoryId: id })
                  props.onSave({ category_id: id })
                }
              }}
            >
              <input
                autoFocus
                className={cn(inputClass, 'h-10 text-sm')}
                value={newCategory}
                maxLength={40}
                placeholder="שם הקטגוריה"
                aria-label="שם הקטגוריה החדשה"
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setNewCategory(null)}
              />
              <Button type="submit" size="sm" variant="ink" className="h-10">
                הוספה
              </Button>
            </form>
          )}
        </div>

        {card.showDescription ? (
          <div>
            <label htmlFor={`desc-${card.key}`} className="mb-1 block text-xs font-semibold text-muted">
              תיאור
            </label>
            <textarea
              id={`desc-${card.key}`}
              className={cn(inputClass, 'min-h-20 py-2 text-sm leading-relaxed')}
              value={card.description}
              maxLength={2000}
              disabled={disabled}
              placeholder="ממה זה עשוי, גודל, למי זה מתאים…"
              onChange={(e) => props.onChange({ description: e.target.value })}
              onBlur={() => props.onSave({ description: card.description.trim() })}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => props.onChange({ showDescription: true })}
            className="self-start text-sm font-medium text-tchelet hover:underline disabled:opacity-50"
          >
            + הוספת תיאור
          </button>
        )}

        {props.aiEnabled && !disabled && cover && (
          <div className="rounded-md bg-sunken p-3 text-sm">
            {suggestion ? (
              <div className="space-y-2">
                <p className="font-semibold">הצעה לפי התמונה (כדאי לבדוק לפני שמירה):</p>
                <p>
                  <span className="text-muted">שם: </span>
                  {suggestion.name}
                </p>
                {suggestion.description && (
                  <p>
                    <span className="text-muted">תיאור: </span>
                    {suggestion.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ink"
                    onClick={() => {
                      props.onChange({ name: suggestion.name, description: suggestion.description, showDescription: true })
                      props.onSave({ name: suggestion.name, description: suggestion.description })
                      setSuggestion(null)
                    }}
                  >
                    להשתמש בהצעה
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                    לא תודה
                  </Button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={askAi} disabled={suggesting} className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline disabled:opacity-60">
                {suggesting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                הצעה לשם ותיאור לפי התמונה
              </button>
            )}
            {suggestError && <p className="mt-1 text-pomegranate">{suggestError}</p>}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 border-t border-line pt-3">
          <SaveIndicator state={card.save} error={card.saveError} />
          <div className="ms-auto flex items-center">
            {mode === 'dashboard' && !disabled && (
              <>
                <IconButton
                  label={card.status === 'hidden' ? 'הצגה בחנות' : 'הסתרה מהחנות'}
                  onClick={() => {
                    const visibility = card.status === 'hidden' ? 'visible' : 'hidden'
                    props.onSave({ visibility })
                  }}
                >
                  {card.status === 'hidden' ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </IconButton>
                <IconButton
                  label={card.inStock ? 'סימון שאזל מהמלאי' : 'סימון שחזר למלאי'}
                  pressed={!card.inStock}
                  onClick={() => {
                    props.onChange({ inStock: !card.inStock })
                    props.onSave({ in_stock: !card.inStock })
                  }}
                >
                  <PackageX className="size-4" />
                </IconButton>
                <IconButton
                  label={card.featured ? 'הסרה מהמומלצים' : 'הצגה במומלצים בעמוד הבית'}
                  pressed={card.featured}
                  onClick={() => {
                    props.onChange({ featured: !card.featured })
                    props.onSave({ is_featured: !card.featured })
                  }}
                >
                  <Star className={cn('size-4', card.featured && 'fill-turmeric text-turmeric-deep')} />
                </IconButton>
                <IconButton label="שכפול" onClick={props.onDuplicate}>
                  <Copy className="size-4" />
                </IconButton>
              </>
            )}
            <IconButton label="הזזה אחורה ברשימה" onClick={() => props.onMove(-1)} disabled={index === 0 || disabled}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="הזזה קדימה ברשימה" onClick={() => props.onMove(1)} disabled={index === total - 1 || disabled}>
              <ArrowDown className="size-4" />
            </IconButton>
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button type="button" onClick={props.onRemove} className="h-8 rounded-md bg-pomegranate px-2.5 text-xs font-semibold text-white">
                  למחוק
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-8 rounded-md px-2 text-xs font-semibold text-muted hover:text-ink">
                  ביטול
                </button>
              </span>
            ) : (
              <IconButton label="מחיקת המוצר" onClick={() => setConfirmDelete(true)} disabled={Boolean(creating && creating.state !== 'error')}>
                <Trash2 className="size-4" />
              </IconButton>
            )}
          </div>
        </div>
        {complete && card.productId && card.status === 'active' && (
          <p className="-mt-1 text-xs text-muted">
            יוצג בחנות ב־<span className="ltr tabular-nums">{formatPrice(parsePriceToAgorot(card.priceInput))}</span>
          </p>
        )}
      </div>
    </li>
  )
}

function SaveIndicator({ state, error }: { state: SaveState; error?: string }) {
  if (state === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-muted" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        שומר…
      </span>
    )
  if (state === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-olive" role="status">
        <Check className="size-3.5" aria-hidden />
        נשמר
      </span>
    )
  if (state === 'error')
    return (
      <span className="text-xs font-medium text-pomegranate" role="alert">
        {error ?? 'השמירה נכשלה'}
      </span>
    )
  return <span />
}

function IconButton({ label, children, pressed, ...props }: React.ComponentProps<'button'> & { label: string; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className="grid size-9 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-35"
      {...props}
    >
      {children}
    </button>
  )
}
