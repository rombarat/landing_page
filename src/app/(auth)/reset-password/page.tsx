import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth-forms'
import { getClaims } from '@/lib/auth'

export const metadata: Metadata = { title: 'סיסמה חדשה' }

export default async function ResetPasswordPage() {
  if (!(await getClaims())) redirect('/forgot-password')
  return <ResetPasswordForm />
}
