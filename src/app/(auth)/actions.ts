'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; fieldErrors?: Record<string, string>; done?: boolean; email?: string }

const email = z.string().trim().toLowerCase().email('כתובת המייל לא נראית תקינה')
const password = z.string().min(8, 'הסיסמה צריכה לכלול לפחות 8 תווים').max(72, 'הסיסמה ארוכה מדי')

function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
}

async function clientKey(scope: string) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  return `${scope}:${ip}`
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

export async function signUpAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password }).safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  if (!rateLimit(await clientKey('signup'), 8, 60 * 60_000)) return { error: 'יותר מדי ניסיונות הרשמה. נסו שוב בעוד שעה.' }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${serverEnv.siteUrl}/auth/confirm?next=/onboarding` },
  })
  if (error) {
    if (/already registered|already exists/i.test(error.message)) return { fieldErrors: { email: 'המייל הזה כבר רשום. אפשר להתחבר במקום.' } }
    if (/password/i.test(error.message)) return { fieldErrors: { password: 'הסיסמה חלשה מדי. נסו סיסמה ארוכה יותר.' } }
    return { error: 'ההרשמה לא הצליחה כרגע. נסו שוב בעוד רגע.' }
  }
  if (data.session) redirect('/onboarding')
  return { done: true, email: parsed.data.email }
}

export async function signInAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password: z.string().min(1, 'צריך להזין סיסמה') })
    .safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  if (!rateLimit(await clientKey('login'), 20, 15 * 60_000)) return { error: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד כמה דקות.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (/not confirmed/i.test(error.message)) return { error: 'צריך לאשר את כתובת המייל לפני ההתחברות. בדקו את תיבת הדואר.' }
    return { error: 'המייל או הסיסמה לא נכונים.' }
  }
  redirect(safeNext(formData.get('next'), '/dashboard'))
}

export async function forgotPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse({ email: formData.get('email') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  if (!rateLimit(await clientKey('reset'), 5, 60 * 60_000)) return { error: 'נשלחו יותר מדי בקשות. נסו שוב מאוחר יותר.' }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${serverEnv.siteUrl}/auth/confirm?next=/reset-password`,
  })
  // Same answer whether or not the account exists.
  return { done: true, email: parsed.data.email }
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: 'הסיסמאות לא תואמות', path: ['confirm'] })
    .safeParse({ password: formData.get('password'), confirm: formData.get('confirm') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { error: 'הקישור לאיפוס פג תוקף. בקשו קישור חדש.' }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'לא הצלחנו לעדכן את הסיסמה. נסו סיסמה אחרת.' }
  redirect('/dashboard')
}
