'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePlatformAdmin } from '../auth'
import { invalidateStorefront } from '../data/storefront'
import { asService, type Tx } from '../db'
import { fail, type ActionResult } from '../merchant'
import { listStoreImages, removeImages } from '../storage'

const uuid = z.string().uuid()

async function audit(tx: Tx, actorId: string, action: string, storeId: string | null, details: Record<string, unknown>) {
  await tx`insert into public.audit_logs (actor_id, store_id, action, details) values (${actorId}, ${storeId}, ${action}, ${tx.json(details as never)})`
}

async function storeOf(tx: Tx, userId: string) {
  const [s] = await tx<{ id: string; slug: string }[]>`select id, slug::text as slug from public.stores where owner_id = ${userId} limit 1`
  return s ?? null
}

/** Manual activation for the MVP (no payment provider yet). */
export async function adminActivateSubscription(userId: string, months: number): Promise<ActionResult> {
  const admin = await requirePlatformAdmin()
  const id = uuid.safeParse(userId)
  const m = z.number().int().min(1).max(24).safeParse(months)
  if (!id.success || !m.success) return fail('בקשה לא תקינה')
  const slug = await asService(async (tx) => {
    await tx`update public.subscriptions set status = 'active', provider = 'manual', updated_by = ${admin.sub},
               current_period_end = greatest(coalesce(current_period_end, now()), now()) + make_interval(months => ${m.data})
             where user_id = ${id.data}`
    const store = await storeOf(tx, id.data)
    await audit(tx, admin.sub, 'subscription.activate', store?.id ?? null, { user_id: id.data, months: m.data })
    return store?.slug
  })
  invalidateStorefront(slug)
  revalidatePath('/platform-admin')
  return { ok: true }
}

export async function adminDeactivateSubscription(userId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin()
  const id = uuid.safeParse(userId)
  if (!id.success) return fail('בקשה לא תקינה')
  const slug = await asService(async (tx) => {
    await tx`update public.subscriptions set status = 'expired', current_period_end = now(), updated_by = ${admin.sub} where user_id = ${id.data}`
    const store = await storeOf(tx, id.data)
    await audit(tx, admin.sub, 'subscription.deactivate', store?.id ?? null, { user_id: id.data })
    return store?.slug
  })
  invalidateStorefront(slug)
  revalidatePath('/platform-admin')
  return { ok: true }
}

/** Testing/support override: extends (or restarts) the trial window by N days. */
export async function adminExtendTrial(userId: string, days: number): Promise<ActionResult> {
  const admin = await requirePlatformAdmin()
  const id = uuid.safeParse(userId)
  const d = z.number().int().min(1).max(60).safeParse(days)
  if (!id.success || !d.success) return fail('בקשה לא תקינה')
  const slug = await asService(async (tx) => {
    await tx`update public.subscriptions set status = 'trialing', updated_by = ${admin.sub},
               trial_started_at = coalesce(trial_started_at, now()),
               trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + make_interval(days => ${d.data})
             where user_id = ${id.data} and status <> 'active'`
    const store = await storeOf(tx, id.data)
    await audit(tx, admin.sub, 'trial.extend', store?.id ?? null, { user_id: id.data, days: d.data })
    return store?.slug
  })
  invalidateStorefront(slug)
  revalidatePath('/platform-admin')
  return { ok: true }
}

/** Testing override: ends the trial now, to exercise the expired state. */
export async function adminExpireTrial(userId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin()
  const id = uuid.safeParse(userId)
  if (!id.success) return fail('בקשה לא תקינה')
  const slug = await asService(async (tx) => {
    await tx`update public.subscriptions set status = 'trialing', updated_by = ${admin.sub},
               trial_started_at = coalesce(trial_started_at, now() - interval '8 days'),
               trial_ends_at = now() - interval '1 minute'
             where user_id = ${id.data} and trial_started_at is not null`
    const store = await storeOf(tx, id.data)
    await audit(tx, admin.sub, 'trial.expire', store?.id ?? null, { user_id: id.data })
    return store?.slug
  })
  invalidateStorefront(slug)
  revalidatePath('/platform-admin')
  return { ok: true }
}

export async function adminSetSuspended(storeId: string, suspended: boolean, reason: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin()
  const id = uuid.safeParse(storeId)
  const r = z.string().trim().max(300).safeParse(reason)
  if (!id.success || !r.success) return fail('בקשה לא תקינה')
  const slug = await asService(async (tx) => {
    const [s] = await tx<{ slug: string }[]>`
      update public.stores set suspended_at = ${suspended ? tx`now()` : null}, suspended_reason = ${suspended ? r.data || null : null}
      where id = ${id.data} returning slug::text as slug`
    await audit(tx, admin.sub, suspended ? 'store.suspend' : 'store.unsuspend', id.data, { reason: r.data })
    return s?.slug
  })
  invalidateStorefront(slug)
  revalidatePath('/platform-admin')
  return { ok: true }
}

/** Deletes stored image files that no database row references (older than 24h). */
export async function adminCleanupOrphans(): Promise<ActionResult<{ removed: number }>> {
  const admin = await requirePlatformAdmin()
  const { stores, referenced } = await asService(async (tx) => {
    const stores = await tx<{ id: string }[]>`select id from public.stores`
    const refs = await tx<{ path: string }[]>`
      select path from public.product_images
      union select logo_path from public.stores where logo_path is not null
      union select hero_image_path from public.store_settings where hero_image_path is not null`
    return { stores: [...stores], referenced: new Set(refs.map((r) => r.path)) }
  })
  const cutoff = Date.now() - 24 * 3600_000
  const orphans: string[] = []
  for (const s of stores) {
    for (const obj of await listStoreImages(s.id)) {
      if (!referenced.has(obj.basePath) && obj.createdAt.getTime() < cutoff) orphans.push(obj.basePath)
    }
  }
  await removeImages(orphans)
  await asService((tx) => audit(tx, admin.sub, 'storage.cleanup', null, { removed: orphans.length }))
  return { ok: true, data: { removed: orphans.length } }
}
