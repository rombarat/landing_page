'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { MailCheck } from 'lucide-react'
import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  type AuthState,
} from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Notice } from '@/components/ui/notice'

const initial: AuthState = {}

function CheckEmail({ email, children }: { email?: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise text-center">
      <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-turmeric-wash text-ink">
        <MailCheck className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold">בדקו את תיבת המייל</h1>
      <p className="mt-2 text-muted">
        שלחנו הודעה אל <span className="ltr font-medium text-ink">{email}</span>. {children}
      </p>
    </div>
  )
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial)
  if (state.done) return <CheckEmail email={state.email}>לחצו על הקישור שבהודעה כדי להמשיך לבניית החנות.</CheckEmail>
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">פותחים דוכן</h1>
        <p className="mt-2 text-muted">כמה דקות והחנות שלך באוויר. בלי כרטיס אשראי.</p>
      </div>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <Field label="מייל" error={state.fieldErrors?.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" className="text-end" required />}
      </Field>
      <Field label="סיסמה" hint="לפחות 8 תווים" error={state.fieldErrors?.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" dir="ltr" className="text-end" required minLength={8} />}
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        יצירת חשבון
      </Button>
      <p className="text-center text-sm text-muted">
        כבר יש לך חשבון?{' '}
        <Link href="/login" className="font-semibold text-tchelet hover:underline">
          התחברות
        </Link>
      </p>
      <p className="text-center text-xs text-subtle">7 ימי ניסיון מתחילים רק כשמפרסמים את החנות. אחר כך 99 ₪ לחודש.</p>
    </form>
  )
}

export function SignInForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState(signInAction, initial)
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">שמחים לראות אותך שוב</h1>
        <p className="mt-2 text-muted">התחברו כדי לנהל את החנות וההזמנות.</p>
      </div>
      {linkError && !state.error && <Notice tone="warning">הקישור כבר לא בתוקף. התחברו או בקשו קישור חדש.</Notice>}
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="מייל" error={state.fieldErrors?.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" className="text-end" required />}
      </Field>
      <Field label="סיסמה" error={state.fieldErrors?.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" dir="ltr" className="text-end" required />}
      </Field>
      <div className="-mt-2 text-start">
        <Link href="/forgot-password" className="text-sm font-medium text-tchelet hover:underline">
          שכחתי סיסמה
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        התחברות
      </Button>
      <p className="text-center text-sm text-muted">
        אין לך חשבון עדיין?{' '}
        <Link href="/signup" className="font-semibold text-tchelet hover:underline">
          פותחים חנות
        </Link>
      </p>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial)
  if (state.done) return <CheckEmail email={state.email}>אם יש חשבון עם הכתובת הזו, יגיע אליו קישור לבחירת סיסמה חדשה.</CheckEmail>
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">איפוס סיסמה</h1>
        <p className="mt-2 text-muted">נשלח אליך קישור לבחירת סיסמה חדשה.</p>
      </div>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <Field label="מייל" error={state.fieldErrors?.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" className="text-end" required />}
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        שליחת קישור
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-tchelet hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initial)
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">בחירת סיסמה חדשה</h1>
      </div>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <Field label="סיסמה חדשה" hint="לפחות 8 תווים" error={state.fieldErrors?.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" dir="ltr" className="text-end" required />}
      </Field>
      <Field label="שוב, לאימות" error={state.fieldErrors?.confirm}>
        {(p) => <Input {...p} name="confirm" type="password" autoComplete="new-password" dir="ltr" className="text-end" required />}
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        שמירת הסיסמה
      </Button>
    </form>
  )
}
