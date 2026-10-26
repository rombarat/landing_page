import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { asService, asUser, type Claims } from './db'
import { createSupabaseServerClient } from './supabase/server'

/** Verified identity of the current request, or null. Cached per request. */
export const getClaims = cache(async (): Promise<Claims | null> => {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  return { sub: data.claims.sub, email: typeof data.claims.email === 'string' ? data.claims.email : undefined }
})

export async function requireClaims(next?: string): Promise<Claims> {
  const claims = await getClaims()
  if (!claims) redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  return claims
}

export type MerchantStore = {
  id: string
  slug: string
  name: string
  category: string
  description: string
  phone: string | null
  whatsapp: string | null
  contact_email: string | null
  instagram: string | null
  logo_path: string | null
  status: 'draft' | 'published' | 'unpublished'
  published_at: Date | null
  accepting_orders: boolean
  suspended_at: Date | null
  suspended_reason: string | null
  role: 'owner' | 'staff'
}

/** The store the signed-in merchant belongs to (MVP: one store per account). RLS-filtered. */
export const getMerchantStore = cache(async (claims: Claims): Promise<MerchantStore | null> => {
  const rows = await asUser(claims, (tx) => tx<MerchantStore[]>`
    select s.id, s.slug::text as slug, s.name, s.category, s.description, s.phone, s.whatsapp, s.contact_email,
           s.instagram, s.logo_path, s.status, s.published_at, s.accepting_orders, s.suspended_at, s.suspended_reason, m.role
    from public.stores s
    join public.store_memberships m on m.store_id = s.id and m.user_id = ${claims.sub}
    order by s.created_at
    limit 1`)
  return rows[0] ?? null
})

/** For dashboard pages: signed in and has a store, otherwise redirect to the right step. */
export async function requireMerchant(next = '/dashboard') {
  const claims = await requireClaims(next)
  const store = await getMerchantStore(claims)
  if (!store) redirect('/onboarding')
  return { claims, store }
}

export const isPlatformAdmin = cache(async (claims: Claims | null): Promise<boolean> => {
  if (!claims) return false
  const rows = await asService((tx) => tx`select 1 from public.platform_admins where user_id = ${claims.sub}`)
  return rows.length > 0
})

/** Platform-admin gate. Membership in platform_admins is managed only via SQL. */
export async function requirePlatformAdmin() {
  const claims = await requireClaims('/platform-admin')
  if (!(await isPlatformAdmin(claims))) redirect('/dashboard')
  return claims
}
