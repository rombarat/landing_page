import 'server-only'
import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { requireMerchant } from '../auth'
import type { StorePayload } from '../types'
import { getPublicStore, getStorePreview } from './storefront'

/** Public store by slug for /s/[slug] routes. Follows old-slug redirects. */
export const loadPublicStore = cache(async (slug: string, subPath = ''): Promise<StorePayload> => {
  if (!/^[a-z0-9-]{3,40}$/i.test(slug)) notFound()
  const result = await getPublicStore(slug)
  if (!result) notFound()
  if ('redirect' in result) permanentRedirect(`/s/${result.redirect}${subPath}`)
  return result
})

/** The signed-in merchant's own store, whatever its publication status. */
export const loadPreviewStore = cache(async (): Promise<StorePayload> => {
  const { claims, store } = await requireMerchant('/preview')
  const payload = await getStorePreview(claims, store.id)
  if (!payload) notFound()
  return payload
})
