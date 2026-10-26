import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth-forms'
import { getClaims } from '@/lib/auth'

export const metadata: Metadata = { title: 'התחברות' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  if (await getClaims()) redirect(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard')
  return <SignInForm next={next} linkError={error === 'link'} />
}
