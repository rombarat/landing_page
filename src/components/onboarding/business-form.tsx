'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { checkSlug, createStoreAction, suggestSlug, type BusinessFormState } from '@/lib/actions/store'
import { cn } from '@/lib/cn'
import { STORE_CATEGORIES } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Textarea, inputClass } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'

export function BusinessForm({ siteUrl }: { siteUrl: string }) {
  const [state, action, pending] = useActionState(createStoreAction, {} as BusinessFormState)
  const [name, setName] = useState(state.values?.name ?? '')
  const [category, setCategory] = useState(state.values?.category ?? '')
  const [slug, setSlug] = useState(state.values?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const host = siteUrl.replace(/^https?:\/\//, '') || 'dukan.app'

  // Suggest an available address from the business name until the merchant edits it.
  useEffect(() => {
    if (slugEdited || name.trim().length < 2) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const suggestion = await suggestSlug(name)
        setSlug(suggestion)
        setSlugStatus('ok')
      })
    }, 450)
    return () => clearTimeout(timer.current)
  }, [name, slugEdited])

  const onSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40)
    setSlug(cleaned)
    setSlugEdited(true)
    setSlugStatus('checking')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await checkSlug(cleaned.replace(/^-|-$/g, ''))
        setSlugStatus(!res.valid ? 'invalid' : res.available ? 'ok' : 'taken')
      })
    }, 400)
  }

  const slugError =
    state.fieldErrors?.slug ??
    (slugStatus === 'taken' ? 'הכתובת הזו כבר תפוסה' : slugStatus === 'invalid' ? 'אותיות באנגלית, ספרות ומקפים, 3–40 תווים' : undefined)

  return (
    <form action={action} className="mt-8 space-y-6" noValidate>
      {state.error && <Notice tone="danger">{state.error}</Notice>}

      <Field label="שם העסק" error={state.fieldErrors?.name}>
        {(p) => (
          <Input
            {...p}
            name="name"
            autoFocus
            maxLength={80}
            placeholder="למשל: העוגות של לינוי"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-13 text-lg"
          />
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold">מה אתם מוכרים?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STORE_CATEGORIES.map((c) => (
            <label
              key={c.value}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-tchelet/30',
                category === c.value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink',
              )}
            >
              <input type="radio" name="category" value={c.value} className="sr-only" checked={category === c.value} onChange={() => setCategory(c.value)} />
              {c.label}
            </label>
          ))}
        </div>
        {state.fieldErrors?.category && <p className="mt-1.5 text-sm font-medium text-pomegranate">{state.fieldErrors.category}</p>}
        <p className="mt-1.5 text-sm text-muted">לפי זה נבחר עיצוב פתיחה מתאים. אפשר להחליף בכל רגע.</p>
      </fieldset>

      <Field label="משפט או שניים על העסק" optional error={state.fieldErrors?.description}>
        {(p) => (
          <Textarea {...p} name="description" maxLength={600} defaultValue={state.values?.description} placeholder="עוגות ביתיות לאירועים קטנים, נאפות לפי הזמנה ברעננה." />
        )}
      </Field>

      <div className="space-y-3">
        <Field label="טלפון ליצירת קשר" hint="מוצג ללקוחות בחנות" error={state.fieldErrors?.phone}>
          {(p) => (
            <Input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className="text-end" placeholder="050-1234567" defaultValue={state.values?.phone} />
          )}
        </Field>
        <Checkbox name="whatsapp_same" defaultChecked label="אפשר לפנות במספר הזה גם בוואטסאפ" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="text-sm font-semibold">כתובת החנות</p>
        <input type="hidden" name="slug" value={slug.replace(/^-|-$/g, '')} />
        {editingSlug ? (
          <div className="mt-2 flex items-center gap-2" dir="ltr">
            <span className="shrink-0 text-sm text-muted">{host}/s/</span>
            <input
              className={cn(inputClass, 'h-10 text-sm')}
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              aria-label="כתובת החנות"
              aria-invalid={slugError ? true : undefined}
              autoFocus
            />
            <button type="button" className="rounded-md p-2 text-muted hover:bg-sunken" onClick={() => setEditingSlug(false)} aria-label="סיום עריכה">
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="ltr truncate text-base font-medium text-tchelet-deep">
              {host}/s/{slug || '…'}
            </span>
            <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-sunken hover:text-ink" onClick={() => setEditingSlug(true)}>
              <Pencil className="size-3.5" aria-hidden />
              שינוי
            </button>
          </div>
        )}
        <p className={cn('mt-1.5 flex items-center gap-1 text-sm', slugError ? 'text-pomegranate' : 'text-muted')} role={slugError ? 'alert' : undefined}>
          {slugStatus === 'checking' && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {slugStatus === 'ok' && !slugError && <Check className="size-3.5 text-olive" aria-hidden />}
          {slugError && <X className="size-3.5" aria-hidden />}
          {slugError ?? (slug ? 'הכתובת פנויה' : 'נמלא אוטומטית לפי שם העסק')}
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" pending={pending} disabled={slugStatus === 'taken' || slugStatus === 'invalid'}>
        להמשיך למוצרים
      </Button>
    </form>
  )
}
