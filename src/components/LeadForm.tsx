import { useState, type FormEvent } from 'react'
import { Button } from './ui/Button'
import { whatsappLink } from '../config'

type Status = 'idle' | 'sent'

export function LeadForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [business, setBusiness] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const msg = `היי, רוצה דף נחיתה.
שם: ${name}
טלפון: ${phone}
שם העסק: ${business}`
    const url = whatsappLink(msg)
    setStatus('sent')
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-line bg-surface rounded-2xl p-7 sm:p-9"
      aria-label="טופס יצירת קשר"
    >
      <div className="gold-rule">
        <span className="text-sm text-gold font-display font-medium">מעדיפים שאחזור אליכם?</span>
      </div>
      <h3 className="mt-5 text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
        השאירו פרטים,
        <br />
        אני חוזר.
      </h3>

      <div className="mt-8 space-y-5">
        <Field
          id="name"
          label="שם מלא"
          value={name}
          onChange={setName}
          required
          autoComplete="name"
        />
        <Field
          id="phone"
          label="טלפון"
          value={phone}
          onChange={setPhone}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
        />
        <Field
          id="business"
          label="שם העסק"
          value={business}
          onChange={setBusiness}
          required
          autoComplete="organization"
        />
      </div>

      <div className="mt-8">
        <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
          שליחה
        </Button>
        {status === 'sent' && (
          <p className="mt-3 text-sm text-ink2" role="status">
            תודה, נפתח לכם וואטסאפ עם ההודעה מוכנה.
          </p>
        )}
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoComplete,
  inputMode,
  dir,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'email' | 'text'
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-muted mb-2">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        dir={dir}
        className="w-full h-12 px-0 bg-transparent text-ink text-lg border-0 border-b border-line2 focus:border-gold focus:outline-none transition-colors duration-150"
      />
    </div>
  )
}
