import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/auth-forms'
import { getClaims } from '@/lib/auth'

export const metadata: Metadata = { title: 'פתיחת חנות' }

export default async function SignUpPage() {
  if (await getClaims()) redirect('/onboarding')
  return <SignUpForm />
}
