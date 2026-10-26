import 'server-only'
import { revalidateTag, unstable_cache } from 'next/cache'
import { asAnon, asUser, type Claims } from '../db'
import type { StorePayload } from '../types'

export const storefrontTag = (slug: string) => `storefront:${slug.toLowerCase()}`

type PublicResult = StorePayload | { redirect: string } | null

/** Public storefront data, cached and invalidated on merchant edits. */
export function getPublicStore(slug: string): Promise<PublicResult> {
  const key = slug.toLowerCase()
  return unstable_cache(
    async () => {
      const rows = await asAnon((tx) => tx`select public.public_store(${key}) as payload`)
      return (rows[0]?.payload ?? null) as PublicResult
    },
    ['public-store', key],
    { tags: [storefrontTag(key)], revalidate: 600 },
  )()
}

/** Unpublished preview for the store's own merchant (not cached). */
export async function getStorePreview(claims: Claims, storeId: string): Promise<StorePayload | null> {
  const rows = await asUser(claims, (tx) => tx`select public.store_preview(${storeId}) as payload`)
  return (rows[0]?.payload ?? null) as StorePayload | null
}

/** Expire cached storefront data immediately so edits show up on the next visit. */
export function invalidateStorefront(...slugs: Array<string | null | undefined>) {
  for (const slug of slugs) if (slug) revalidateTag(storefrontTag(slug), { expire: 0 })
}
