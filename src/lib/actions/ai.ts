'use server'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { getEnrichmentProvider, type ProductSuggestion } from '../ai/enrichment'
import { asUser } from '../db'
import { serverEnv } from '../env'
import { mediaUrl } from '../media'
import { fail, merchantContext, type ActionResult } from '../merchant'
import { rateLimit } from '../rate-limit'
import { LOCAL_STORAGE_DIR } from '../storage'

export async function suggestProductDetails(productId: string): Promise<ActionResult<ProductSuggestion>> {
  const provider = getEnrichmentProvider()
  if (!provider) return fail('הצעות אוטומטיות לא מופעלות בחנות הזו.')
  const id = z.string().uuid().safeParse(productId)
  if (!id.success) return fail('המוצר לא נמצא')
  const { store, claims } = await merchantContext()
  if (!rateLimit(`ai:${store.id}`, 40, 60 * 60_000)) return fail('הגעתם למכסת ההצעות לשעה הקרובה.')

  const data = await asUser(claims, async (tx) => {
    const [img] = await tx<{ path: string }[]>`
      select path from public.product_images where product_id = ${id.data} and store_id = ${store.id} order by position limit 1`
    const cats = await tx<{ name: string }[]>`select name from public.categories where store_id = ${store.id} order by position`
    return { path: img?.path, categories: cats.map((c) => c.name) }
  })
  if (!data.path) return fail('צריך תמונה כדי לקבל הצעה')

  let image: Buffer
  if (serverEnv.storageDriver === 'local') {
    image = await readFile(path.join(LOCAL_STORAGE_DIR, `${data.path}-640.webp`))
  } else {
    const res = await fetch(mediaUrl(data.path, 'thumb')!)
    if (!res.ok) return fail('לא הצלחנו לקרוא את התמונה')
    image = Buffer.from(await res.arrayBuffer())
  }

  try {
    const suggestion = await provider.suggest({ image, mediaType: 'image/webp', businessCategory: store.category, existingCategories: data.categories })
    return { ok: true, data: suggestion }
  } catch (e) {
    console.error('enrichment failed', e)
    return fail('לא הצלחנו להציע כרגע. אפשר למלא ידנית.')
  }
}
