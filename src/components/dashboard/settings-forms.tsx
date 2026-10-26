'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { changeSlug, publishStore, unpublishStore, updatePickup, updateStoreDetails } from '@/lib/actions/store'
import type { MerchantStore } from '@/lib/auth'
import { STORE_CATEGORIES } from '@/lib/themes'
import type { StoreSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'
import { Panel, PanelHeader } from '@/components/ui/panel'

type Result = { ok: boolean; error?: string }

function useSave() {
  const router = useRouter()
  const [state, setState] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const save = (fn: () => Promise<Result>, success = 'השינויים נשמרו') =>
    startTransition(async () => {
      setState(null)
      const res = await fn()
      setState(res.ok ? { tone: 'success', text: success } : { tone: 'danger', text: res.error ?? 'השמירה נכשלה' })
      if (res.ok) router.refresh()
    })
  return { state, pending, save }
}

export function SettingsForms({ store, settings, siteUrl }: { store: MerchantStore; settings: StoreSettings; siteUrl: string }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DetailsForm store={store} />
      <div className="space-y-6">
        <PickupForm settings={settings} />
        <AddressForm slug={store.slug} siteUrl={siteUrl} isOwner={store.role === 'owner'} />
        <VisibilityPanel store={store} />
      </div>
    </div>
  )
}

function DetailsForm({ store }: { store: MerchantStore }) {
  const { state, pending, save } = useSave()
  const [v, setV] = useState({
    name: store.name,
    category: store.category,
    description: store.description,
    phone: store.phone ?? '',
    whatsapp: store.whatsapp ?? '',
    contact_email: store.contact_email ?? '',
    instagram: store.instagram ?? '',
    accepting_orders: store.accepting_orders,
  })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value })
  return (
    <Panel>
      <PanelHeader title="פרטי העסק" />
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          save(() => updateStoreDetails(v))
        }}
      >
        <Field label="שם העסק">{(p) => <Input {...p} value={v.name} onChange={set('name')} maxLength={80} required />}</Field>
        <Field label="סוג העסק">
          {(p) => (
            <Select {...p} value={v.category} onChange={set('category')}>
              {STORE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="תיאור קצר" optional>
          {(p) => <Textarea {...p} value={v.description} onChange={set('description')} maxLength={600} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="טלפון">{(p) => <Input {...p} type="tel" dir="ltr" className="text-end" value={v.phone} onChange={set('phone')} />}</Field>
          <Field label="וואטסאפ">{(p) => <Input {...p} type="tel" dir="ltr" className="text-end" value={v.whatsapp} onChange={set('whatsapp')} />}</Field>
          <Field label="מייל ליצירת קשר" optional>
            {(p) => <Input {...p} type="email" dir="ltr" className="text-end" value={v.contact_email} onChange={set('contact_email')} />}
          </Field>
          <Field label="אינסטגרם" optional hint="שם המשתמש, בלי @">
            {(p) => <Input {...p} dir="ltr" className="text-end" value={v.instagram} onChange={set('instagram')} />}
          </Field>
        </div>
        <Checkbox
          checked={v.accepting_orders}
          onChange={(e) => setV({ ...v, accepting_orders: e.target.checked })}
          label="החנות מקבלת הזמנות"
          hint="בטלו כדי להשהות הזמנות חדשות (למשל בחופשה). החנות עדיין גלויה."
        />
        {state && <Notice tone={state.tone}>{state.text}</Notice>}
        <Button type="submit" pending={pending}>
          שמירת הפרטים
        </Button>
      </form>
    </Panel>
  )
}

function PickupForm({ settings }: { settings: StoreSettings }) {
  const { state, pending, save } = useSave()
  const [v, setV] = useState({
    pickup_address: settings.pickup_address,
    pickup_instructions: settings.pickup_instructions,
    pickup_requires_slot: settings.pickup_requires_slot,
    pickup_lead_hours: settings.pickup_lead_hours,
    payment_note: settings.payment_note,
  })
  return (
    <Panel>
      <PanelHeader title="איסוף ותשלום" />
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          save(() => updatePickup(v))
        }}
      >
        <Field label="כתובת לאיסוף" optional>
          {(p) => <Input {...p} value={v.pickup_address} maxLength={200} onChange={(e) => setV({ ...v, pickup_address: e.target.value })} />}
        </Field>
        <Field label="הנחיות לאיסוף" optional>
          {(p) => <Textarea {...p} value={v.pickup_instructions} maxLength={600} onChange={(e) => setV({ ...v, pickup_instructions: e.target.value })} />}
        </Field>
        <Checkbox checked={v.pickup_requires_slot} onChange={(e) => setV({ ...v, pickup_requires_slot: e.target.checked })} label="לבקש מועד איסוף בהזמנה" />
        <Field label="זמן הכנה מינימלי (שעות)">
          {(p) => (
            <Input
              {...p}
              type="number"
              min={0}
              max={336}
              className="w-28"
              value={v.pickup_lead_hours}
              onChange={(e) => setV({ ...v, pickup_lead_hours: Math.max(0, Math.min(336, Number(e.target.value) || 0)) })}
            />
          )}
        </Field>
        <Field label="הסבר על התשלום" hint="מוצג ללקוחות. אין סליקה באתר.">
          {(p) => <Textarea {...p} value={v.payment_note} maxLength={300} onChange={(e) => setV({ ...v, payment_note: e.target.value })} />}
        </Field>
        {state && <Notice tone={state.tone}>{state.text}</Notice>}
        <Button type="submit" pending={pending}>
          שמירה
        </Button>
      </form>
    </Panel>
  )
}

function AddressForm({ slug: initial, siteUrl, isOwner }: { slug: string; siteUrl: string; isOwner: boolean }) {
  const { state, pending, save } = useSave()
  const [slug, setSlug] = useState(initial)
  const host = siteUrl.replace(/^https?:\/\//, '')
  return (
    <Panel>
      <PanelHeader title="כתובת החנות" description="קישורים ישנים ימשיכו לעבוד ויפנו לכתובת החדשה." />
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          save(() => changeSlug(slug), 'הכתובת עודכנה')
        }}
      >
        <div className="flex items-center gap-2" dir="ltr">
          <span className="shrink-0 text-sm text-muted">{host}/s/</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} maxLength={40} aria-label="כתובת החנות" disabled={!isOwner} />
        </div>
        {state && <Notice tone={state.tone}>{state.text}</Notice>}
        <Button type="submit" variant="outline" pending={pending} disabled={!isOwner || slug === initial}>
          עדכון הכתובת
        </Button>
      </form>
    </Panel>
  )
}

function VisibilityPanel({ store }: { store: MerchantStore }) {
  const { state, pending, save } = useSave()
  const live = store.status === 'published'
  return (
    <Panel>
      <PanelHeader title="נראות החנות" />
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">
          {live ? 'החנות גלויה לכולם. הסתרה תסגור אותה ללקוחות, בלי למחוק שום דבר.' : 'החנות מוסתרת. רק אתם רואים אותה בתצוגה המקדימה.'}
        </p>
        {state && <Notice tone={state.tone}>{state.text}</Notice>}
        {live ? (
          <Button type="button" variant="outline" pending={pending} onClick={() => save(() => unpublishStore(), 'החנות הוסתרה')}>
            הסתרת החנות
          </Button>
        ) : (
          <Button type="button" pending={pending} onClick={() => save(() => publishStore(), 'החנות פורסמה')}>
            פרסום החנות שלי
          </Button>
        )}
      </div>
    </Panel>
  )
}
