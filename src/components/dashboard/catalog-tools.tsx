'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { createCategory, deleteCategory, renameCategory, reorderCategories, setProductsStatus } from '@/lib/actions/products'
import type { EditorCategory, EditorProduct } from '@/lib/data/merchant'
import { mediaUrl } from '@/lib/media'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/components/ui/field'
import { cn } from '@/lib/cn'

export function CategoryManager({ categories: initial }: { categories: EditorCategory[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null)
      const res = await fn()
      if (!res.ok) setError(res.error ?? 'הפעולה נכשלה')
      router.refresh()
    })

  const move = (i: number, dir: -1 | 1) => {
    const next = [...categories]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    setCategories(next)
    run(() => reorderCategories(next.map((c) => c.id)))
  }

  return (
    <div className="p-5">
      {categories.length > 0 && (
        <ul className="mb-4 divide-y divide-line rounded-md border border-line">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              {editing?.id === c.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const value = editing.name.trim()
                    setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: value } : x)))
                    setEditing(null)
                    run(() => renameCategory(c.id, value))
                  }}
                >
                  <input autoFocus className={cn(inputClass, 'h-9 text-sm')} value={editing.name} maxLength={40} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} aria-label="שם הקטגוריה" />
                  <Button type="submit" size="sm" variant="ink">
                    שמירה
                  </Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className="text-xs text-muted tabular-nums">{c.product_count} מוצרים</span>
                  <IconBtn label="שינוי שם" onClick={() => setEditing({ id: c.id, name: c.name })}>
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn label="למעלה" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn label="למטה" onClick={() => move(i, 1)} disabled={i === categories.length - 1}>
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="מחיקת הקטגוריה (המוצרים נשארים)"
                    onClick={() => {
                      setCategories((prev) => prev.filter((x) => x.id !== c.id))
                      run(() => deleteCategory(c.id))
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          const value = name.trim()
          setName('')
          run(async () => {
            const res = await createCategory(value)
            if (res.ok) setCategories((prev) => [...prev, { ...res.data!, position: prev.length, product_count: 0 }])
            return res
          })
        }}
      >
        <input className={cn(inputClass, 'h-10')} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="קטגוריה חדשה, למשל: עוגות" aria-label="שם קטגוריה חדשה" />
        <Button type="submit" variant="ink" size="sm" className="h-10" pending={pending}>
          הוספה
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-pomegranate">{error}</p>}
    </div>
  )
}

export function ArchivedProducts({ products }: { products: EditorProduct[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  if (products.length === 0) return <p className="p-5 text-sm text-muted">אין מוצרים בארכיון.</p>
  return (
    <ul className="divide-y divide-line">
      {products.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-5 py-3">
          <span className="size-10 shrink-0 overflow-hidden rounded-sm bg-sunken">
            {p.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(p.images[0].path, 'thumb')!} alt="" className="size-full object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{p.name || 'מוצר בלי שם'}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setProductsStatus([p.id], 'hidden')
                router.refresh()
              })
            }
          >
            החזרה (מוסתר)
          </Button>
        </li>
      ))}
    </ul>
  )
}

function IconBtn({ label, children, ...props }: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink disabled:opacity-30" {...props}>
      {children}
    </button>
  )
}
