import 'server-only'
import { getMerchantStore, requireClaims, type MerchantStore } from './auth'
import type { Claims } from './db'

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

/** Resolves the acting merchant and their store from the verified session only. */
export async function merchantContext(): Promise<{ claims: Claims; store: MerchantStore }> {
  const claims = await requireClaims()
  const store = await getMerchantStore(claims)
  if (!store) throw new Error('no_store')
  return { claims, store }
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}
