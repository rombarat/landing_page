'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Check, ImagePlus, Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react'
import '@/components/store/fonts'
import { removeBrandImage, updateDesign, type DesignInput } from '@/lib/actions/store'
import { uploadImage } from '@/lib/client/upload'
import { cn } from '@/lib/cn'
import { mediaUrl } from '@/lib/media'
import { COLOR_SWATCHES, FONT_PRESETS, FONT_PRESET_KEYS, TEMPLATES, TEMPLATE_KEYS, readableOn, type FontPresetKey, type TemplateKey } from '@/lib/themes'
import type { StoreSettings } from '@/lib/types'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'

type Props = {
  settings: StoreSettings
  storeName: string
  logoPath: string | null
  sampleImages: string[]
  mode: 'onboarding' | 'dashboard'
}

export function DesignEditor({ settings, storeName, logoPath: initialLogo, sampleImages, mode }: Props) {
  const [design, setDesign] = useState<DesignInput>({
    template: settings.template,
    font_preset: settings.font_preset,
    color_primary: settings.color_primary,
    color_accent: settings.color_accent,
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle,
    about_title: settings.about_title,
    about_text: settings.about_text,
  })
  const [logoPath, setLogoPath] = useState(initialLogo)
  const [heroPath, setHeroPath] = useState(settings.hero_image_path)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [previewKey, setPreviewKey] = useState(0)
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')
  const [uploading, setUploading] = useState<'logo' | 'hero' | null>(null)
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      startTransition(async () => {
        setSaveState('saving')
        const res = await updateDesign(design)
        if (res.ok) {
          setSaveState('saved')
          setError(null)
          setPreviewKey((k) => k + 1)
        } else {
          setSaveState('error')
          setError(res.error)
        }
      })
    }, 500)
    return () => clearTimeout(timer.current)
  }, [design])

  const set = <K extends keyof DesignInput>(key: K, value: DesignInput[K]) => setDesign((d) => ({ ...d, [key]: value }))

  const pickTemplate = (key: TemplateKey) => {
    const tpl = TEMPLATES[key]
    setDesign((d) => ({ ...d, template: key, font_preset: tpl.defaultFont }))
  }

  const upload = async (kind: 'logo' | 'hero', file: File | undefined) => {
    if (!file) return
    setUploading(kind)
    setError(null)
    try {
      const res = await uploadImage(file, kind)
      if (res.type === 'logo') setLogoPath(res.path)
      if (res.type === 'hero') setHeroPath(res.path)
      setPreviewKey((k) => k + 1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  const removeImage = (kind: 'logo' | 'hero') =>
    startTransition(async () => {
      await removeBrandImage(kind)
      if (kind === 'logo') setLogoPath(null)
      else setHeroPath(null)
      setPreviewKey((k) => k + 1)
    })

  const sample = sampleImages[0] ?? null

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="flex gap-1 rounded-md bg-sunken p-1 lg:hidden" role="tablist" aria-label="מצב תצוגה">
        {(['edit', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={mobileTab === t}
            onClick={() => setMobileTab(t)}
            className={cn('flex-1 rounded px-3 py-2 text-sm font-semibold', mobileTab === t ? 'bg-surface shadow-sm' : 'text-muted')}
          >
            {t === 'edit' ? 'עריכה' : 'איך זה נראה'}
          </button>
        ))}
      </div>

      <div className={cn('space-y-8', mobileTab === 'preview' && 'hidden lg:block')}>
        <div className="lg:hidden">
          <SaveBadge state={saveState} />
        </div>
        {error && <Notice tone="danger">{error}</Notice>}

        <section aria-labelledby="tpl-heading">
          <h2 id="tpl-heading" className="text-lg font-semibold">
            סגנון
          </h2>
          <div className="mt-3 grid gap-3">
            {TEMPLATE_KEYS.map((key) => (
              <TemplateOption key={key} template={key} selected={design.template === key} onSelect={() => pickTemplate(key)} sample={sample} name={storeName} colors={key === design.template ? { primary: design.color_primary, accent: design.color_accent } : TEMPLATES[key].defaultColors} />
            ))}
          </div>
        </section>

        <section aria-labelledby="color-heading">
          <h2 id="color-heading" className="text-lg font-semibold">
            צבעים
          </h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {COLOR_SWATCHES.map((s) => {
              const active = s.primary.toUpperCase() === design.color_primary.toUpperCase() && s.accent.toUpperCase() === design.color_accent.toUpperCase()
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setDesign((d) => ({ ...d, color_primary: s.primary, color_accent: s.accent }))}
                  aria-pressed={active}
                  aria-label={s.name}
                  title={s.name}
                  className={cn('flex h-12 overflow-hidden rounded-md border-2 transition-colors', active ? 'border-ink' : 'border-transparent hover:border-line-strong')}
                >
                  <span className="flex-[2]" style={{ background: s.primary }} />
                  <span className="flex-1" style={{ background: s.accent }} />
                </button>
              )
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ColorInput label="צבע ראשי" value={design.color_primary} onChange={(v) => set('color_primary', v)} />
            <ColorInput label="צבע הדגשה" value={design.color_accent} onChange={(v) => set('color_accent', v)} />
          </div>
        </section>

        <section aria-labelledby="font-heading">
          <h2 id="font-heading" className="text-lg font-semibold">
            גופן
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {FONT_PRESET_KEYS.map((key: FontPresetKey) => {
              const f = FONT_PRESETS[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('font_preset', key)}
                  aria-pressed={design.font_preset === key}
                  className={cn('rounded-md border-2 px-3 py-3 text-start transition-colors', design.font_preset === key ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-line-strong')}
                >
                  <span className="block truncate text-2xl leading-tight" style={{ fontFamily: f.display, fontWeight: f.displayWeight }}>
                    {storeName || 'שם החנות'}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{f.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="logo-heading">
          <h2 id="logo-heading" className="text-lg font-semibold">
            לוגו <span className="text-sm font-normal text-muted">(לא חובה)</span>
          </h2>
          <BrandImageControl
            path={logoPath}
            uploading={uploading === 'logo'}
            onFile={(f) => upload('logo', f)}
            onRemove={() => removeImage('logo')}
            hint="תמונה ריבועית נראית הכי טוב. בלי לוגו נציג את שם העסק."
            round
          />
        </section>

        {mode === 'dashboard' && (
          <>
            <section aria-labelledby="hero-heading" className="space-y-4">
              <h2 id="hero-heading" className="text-lg font-semibold">
                החלק העליון של החנות
              </h2>
              <Field label="כותרת" hint="אם ריק, יוצג שם העסק">
                {(p) => <Input {...p} value={design.hero_title} maxLength={90} onChange={(e) => set('hero_title', e.target.value)} placeholder={storeName} />}
              </Field>
              <Field label="משפט מתחת לכותרת" hint="אם ריק, יוצג תיאור העסק">
                {(p) => <Textarea {...p} value={design.hero_subtitle} maxLength={200} onChange={(e) => set('hero_subtitle', e.target.value)} />}
              </Field>
              <div>
                <p className="text-sm font-semibold">תמונה ראשית</p>
                <BrandImageControl
                  path={heroPath}
                  uploading={uploading === 'hero'}
                  onFile={(f) => upload('hero', f)}
                  onRemove={() => removeImage('hero')}
                  hint="בלי תמונה ראשית נשתמש בתמונת המוצר הראשון."
                />
              </div>
            </section>
            <section aria-labelledby="about-heading" className="space-y-4">
              <h2 id="about-heading" className="text-lg font-semibold">
                אודות
              </h2>
              <Field label="כותרת">{(p) => <Input {...p} value={design.about_title} maxLength={80} onChange={(e) => set('about_title', e.target.value)} placeholder="קצת עלינו" />}</Field>
              <Field label="טקסט" hint="הסיפור של העסק, מה מיוחד בו, למי הוא מתאים">
                {(p) => <Textarea {...p} value={design.about_text} maxLength={1500} rows={6} onChange={(e) => set('about_text', e.target.value)} />}
              </Field>
            </section>
          </>
        )}
      </div>

      <div className={cn('lg:sticky lg:top-24 lg:self-start', mobileTab === 'edit' && 'hidden lg:block')}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <SaveBadge state={saveState} />
          <div className="hidden gap-1 rounded-md bg-sunken p-1 lg:flex" role="group" aria-label="גודל תצוגה">
            <button type="button" onClick={() => setDevice('mobile')} aria-pressed={device === 'mobile'} className={cn('rounded px-2.5 py-1.5', device === 'mobile' ? 'bg-surface shadow-sm' : 'text-muted')} aria-label="תצוגת טלפון">
              <Smartphone className="size-4" />
            </button>
            <button type="button" onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'} className={cn('rounded px-2.5 py-1.5', device === 'desktop' ? 'bg-surface shadow-sm' : 'text-muted')} aria-label="תצוגת מחשב">
              <Monitor className="size-4" />
            </button>
          </div>
        </div>
        <div className={cn('mx-auto overflow-hidden border border-line-strong bg-surface shadow-float transition-[max-width] duration-300', device === 'mobile' ? 'max-w-[390px] rounded-[2rem] border-[6px] border-ink' : 'max-w-full rounded-lg')}>
          <iframe key={previewKey} src="/preview" title="תצוגה מקדימה של החנות" className={cn('block w-full', device === 'mobile' ? 'h-[720px]' : 'h-[760px]')} />
        </div>
      </div>
    </div>
  )
}

function SaveBadge({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted" role="status" aria-live="polite">
      {state === 'saving' && (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden /> שומר ומעדכן את התצוגה…
        </>
      )}
      {state === 'saved' && (
        <>
          <Check className="size-4 text-olive" aria-hidden /> נשמר
        </>
      )}
      {state === 'idle' && 'כל שינוי נשמר אוטומטית'}
      {state === 'error' && <span className="text-pomegranate">השמירה נכשלה</span>}
    </p>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-line bg-surface p-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-9 cursor-pointer rounded border-0 bg-transparent p-0" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="ltr block text-xs text-muted uppercase">{value}</span>
      </span>
    </label>
  )
}

function BrandImageControl({ path, uploading, onFile, onRemove, hint, round }: { path: string | null; uploading: boolean; onFile: (f: File | undefined) => void; onRemove: () => void; hint: string; round?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="mt-3 flex items-center gap-4">
      <div className={cn('grid size-20 shrink-0 place-items-center overflow-hidden border border-line bg-sunken', round ? 'rounded-full' : 'rounded-md')}>
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden />
        ) : path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(path, 'thumb')!} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted" aria-hidden />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="h-9 rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold hover:border-ink">
            {path ? 'החלפה' : 'העלאה'}
          </button>
          {path && (
            <button type="button" onClick={onRemove} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted hover:text-pomegranate">
              <Trash2 className="size-4" aria-hidden />
              הסרה
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <input
        ref={input}
        aria-label="בחירת תמונה"
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** A small, honest sketch of each template using the merchant's own first photo. */
function TemplateOption({ template, selected, onSelect, sample, name, colors }: { template: TemplateKey; selected: boolean; onSelect: () => void; sample: string | null; name: string; colors: { primary: string; accent: string } }) {
  const tpl = TEMPLATES[template]
  const font = FONT_PRESETS[tpl.defaultFont]
  const img = sample ? mediaUrl(sample, 'thumb') : null
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn('flex items-stretch gap-4 rounded-lg border-2 bg-surface p-3 text-start transition-colors', selected ? 'border-ink' : 'border-line hover:border-line-strong')}
    >
      <span className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-md" style={{ background: tpl.tokens.bg }} aria-hidden>
        {template === 'bold' && <span className="absolute inset-x-0 top-0 h-4" style={{ background: colors.primary }} />}
        <span className="absolute start-2 end-2 top-5 truncate text-[13px] leading-none" style={{ fontFamily: font.display, fontWeight: font.displayWeight, color: template === 'artisan' ? colors.primary : tpl.tokens.text }}>
          {name || 'החנות שלי'}
        </span>
        <span
          className="absolute bottom-2 end-2 block h-12 w-12 overflow-hidden"
          style={{ borderRadius: template === 'artisan' ? 10 : 0, border: template === 'bold' ? `2px solid ${tpl.tokens.text}` : undefined, background: '#ddd' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} alt="" className="size-full object-cover" />}
        </span>
        <span className="absolute bottom-2 start-2 rounded-sm px-1.5 py-0.5 text-[9px] font-bold" style={{ background: template === 'bold' ? colors.accent : colors.primary, color: readableOn(template === 'bold' ? colors.accent : colors.primary), borderRadius: tpl.radius.button === '999px' ? 999 : tpl.radius.button }}>
          להזמנה
        </span>
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <span className="flex items-center gap-2 font-semibold">
          {tpl.name}
          {selected && <Check className="size-4 text-olive" aria-hidden />}
        </span>
        <span className="text-sm text-ink-soft">{tpl.tagline}</span>
        <span className="mt-1 text-xs text-muted">מתאים ל{tpl.fits}</span>
      </span>
    </button>
  )
}
