'use server'

import { z } from 'zod'
import { asUser, type Tx } from '../db'
import { invalidateStorefront } from '../data/storefront'
import { fail, merchantContext, type ActionResult } from '../merchant'
import { productSlugFrom } from '../slug'
import { removeImages } from '../storage'

const uuid = z.string().uuid()

async function uniqueProductSlug(tx: Tx, storeId: string, name: string, productId?: string) {
  const base = productSlugFrom(name).slice(0, 60)
  const rows = await tx<{ slug: string }[]>`
    select slug from public.products
    where store_id = ${storeId} and (slug = ${base} or slug like ${base + '-%'}) and id is distinct from ${productId ?? null}`
  const taken = new Set(rows.map((r) => r.slug))
  if (!taken.has(base)) return base
  for (let i = 2; i < 500; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
  return `${base}-${Date.now().toString(36)}`
}

/** Deletes storage files no longer referenced by any image row of the store. */
async function cleanupFiles(tx: Tx, storeId: string, paths: string[]) {
  if (paths.length === 0) return []
  const still = await tx<{ path: string }[]>`select path from public.product_images where store_id = ${storeId} and path = any(${paths}::text[])`
  const used = new Set(still.map((r) => r.path))
  return paths.filter((p) => !used.has(p))
}

const patchSchema = z.object({
  name: z.string().trim().max(100, 'שם המוצר ארוך מדי').optional(),
  description: z.string().trim().max(2000, 'התיאור ארוך מדי').optional(),
  price_agorot: z.number().int().min(0).max(10_000_000).nullable().optional(),
  category_id: uuid.nullable().optional(),
  in_stock: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  visibility: z.enum(['visible', 'hidden']).optional(),
})
export type ProductPatch = z.infer<typeof patchSchema>

export type ProductStatusResult = { status: 'draft' | 'active' | 'hidden' | 'archived'; slug: string }

export async function updateProduct(productId: string, patch: ProductPatch): Promise<ActionResult<ProductStatusResult>> {
  const id = uuid.safeParse(productId)
  const parsed = patchSchema.safeParse(patch)
  if (!id.success || !parsed.success) return fail(parsed.error?.issues[0]?.message ?? 'הנתונים לא תקינים')
  const { store, claims } = await merchantContext()
  const p = parsed.data

  const result = await asUser(claims, async (tx) => {
    const [current] = await tx<{ name: string; price_agorot: number | null; status: string; slug: string }[]>`
      select name, price_agorot, status, slug from public.products where id = ${id.data} and store_id = ${store.id} for update`
    if (!current) return null
    const name = p.name ?? current.name
    const price = p.price_agorot === undefined ? current.price_agorot : p.price_agorot
    const complete = name.trim().length > 0 && price != null

    let status = current.status
    if (p.visibility === 'hidden') status = 'hidden'
    else if (p.visibility === 'visible') status = complete ? 'active' : 'draft'
    else if (status === 'draft' && complete) status = 'active'
    else if (status === 'active' && !complete) status = 'draft'

    const slug = p.name !== undefined && p.name !== current.name && name.trim() ? await uniqueProductSlug(tx, store.id, name, id.data) : current.slug
    const [row] = await tx<{ status: ProductStatusResult['status']; slug: string }[]>`
      update public.products set
        name = ${name},
        slug = ${slug},
        description = coalesce(${p.description ?? null}, description),
        price_agorot = ${price},
        category_id = ${p.category_id === undefined ? tx`category_id` : p.category_id},
        in_stock = coalesce(${p.in_stock ?? null}, in_stock),
        is_featured = coalesce(${p.is_featured ?? null}, is_featured),
        status = ${status}
      where id = ${id.data} and store_id = ${store.id}
      returning status, slug`
    return row ?? null
  })
  if (!result) return fail('המוצר לא נמצא')
  invalidateStorefront(store.slug)
  return { ok: true, data: result }
}

export async function createEmptyProduct(): Promise<ActionResult<{ id: string }>> {
  const { store, claims } = await merchantContext()
  const row = await asUser(claims, async (tx) => {
    const [{ count }] = (await tx`select count(*)::int as count from public.products where store_id = ${store.id}`) as unknown as [{ count: number }]
    if (count >= 300) return null
    const [p] = await tx<{ id: string }[]>`
      insert into public.products (store_id, slug, position)
      values (${store.id}, ${'item-' + crypto.randomUUID().slice(0, 8)},
              coalesce((select max(position) + 1 from public.products where store_id = ${store.id}), 0))
      returning id`
    return p
  })
  if (!row) return fail('הגעת למספר המוצרים המרבי בחנות')
  return { ok: true, data: row }
}

export async function deleteProducts(productIds: string[]): Promise<ActionResult> {
  const ids = z.array(uuid).min(1).max(300).safeParse(productIds)
  if (!ids.success) return fail('לא נבחרו מוצרים')
  const { store, claims } = await merchantContext()
  const orphaned = await asUser(claims, async (tx) => {
    const images = await tx<{ path: string }[]>`
      select path from public.product_images where store_id = ${store.id} and product_id = any(${ids.data}::uuid[])`
    await tx`delete from public.products where store_id = ${store.id} and id = any(${ids.data}::uuid[])`
    return cleanupFiles(tx, store.id, images.map((i) => i.path))
  })
  await removeImages(orphaned)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function setProductsStatus(productIds: string[], status: 'active' | 'hidden' | 'archived'): Promise<ActionResult<{ skipped: number }>> {
  const ids = z.array(uuid).min(1).max(300).safeParse(productIds)
  const st = z.enum(['active', 'hidden', 'archived']).safeParse(status)
  if (!ids.success || !st.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  const skipped = await asUser(claims, async (tx) => {
    if (st.data === 'active') {
      const res = await tx`update public.products set status = 'active'
        where store_id = ${store.id} and id = any(${ids.data}::uuid[]) and btrim(name) <> '' and price_agorot is not null`
      return ids.data.length - res.count
    }
    await tx`update public.products set status = ${st.data} where store_id = ${store.id} and id = any(${ids.data}::uuid[])`
    return 0
  })
  invalidateStorefront(store.slug)
  return { ok: true, data: { skipped } }
}

export async function bulkUpdateProducts(
  productIds: string[],
  change: { category_id?: string | null; in_stock?: boolean; price_percent?: number },
): Promise<ActionResult> {
  const ids = z.array(uuid).min(1).max(300).safeParse(productIds)
  const ch = z
    .object({ category_id: uuid.nullable().optional(), in_stock: z.boolean().optional(), price_percent: z.number().min(-90).max(500).optional() })
    .safeParse(change)
  if (!ids.success || !ch.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  await asUser(claims, async (tx) => {
    if (ch.data.category_id !== undefined)
      await tx`update public.products set category_id = ${ch.data.category_id} where store_id = ${store.id} and id = any(${ids.data}::uuid[])`
    if (ch.data.in_stock !== undefined)
      await tx`update public.products set in_stock = ${ch.data.in_stock} where store_id = ${store.id} and id = any(${ids.data}::uuid[])`
    if (ch.data.price_percent !== undefined && ch.data.price_percent !== 0)
      await tx`update public.products set price_agorot = round(price_agorot * (100 + ${ch.data.price_percent}::numeric) / 100)
               where store_id = ${store.id} and id = any(${ids.data}::uuid[]) and price_agorot is not null`
  })
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function duplicateProduct(productId: string): Promise<ActionResult<{ id: string }>> {
  const id = uuid.safeParse(productId)
  if (!id.success) return fail('המוצר לא נמצא')
  const { store, claims } = await merchantContext()
  const created = await asUser(claims, async (tx) => {
    const [src] = await tx<{ name: string }[]>`select name from public.products where id = ${id.data} and store_id = ${store.id}`
    if (!src) return null
    const name = src.name ? `${src.name} (עותק)`.slice(0, 100) : ''
    const slug = await uniqueProductSlug(tx, store.id, name || 'item')
    const [copy] = await tx<{ id: string }[]>`
      insert into public.products (store_id, category_id, name, slug, description, price_agorot, status, in_stock, is_featured, position)
      select store_id, category_id, ${name}, ${slug}, description, price_agorot, 'hidden', in_stock, false, position + 1
      from public.products where id = ${id.data}
      returning id`
    // Images are shared by path; files are only removed once no row references them.
    await tx`insert into public.product_images (store_id, product_id, path, width, height, bytes, alt, position)
             select store_id, ${copy!.id}, path, width, height, bytes, alt, position from public.product_images where product_id = ${id.data}`
    return copy!
  })
  if (!created) return fail('המוצר לא נמצא')
  return { ok: true, data: created }
}

export async function reorderProducts(orderedIds: string[]): Promise<ActionResult> {
  const ids = z.array(uuid).min(1).max(300).safeParse(orderedIds)
  if (!ids.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  await asUser(claims, async (tx) => {
    await tx`update public.products p set position = o.ord
             from unnest(${ids.data}::uuid[]) with ordinality as o(id, ord)
             where p.id = o.id and p.store_id = ${store.id}`
  })
  invalidateStorefront(store.slug)
  return { ok: true }
}

/** Groups several photo-cards into one product: images move to the first product. */
export async function mergeProducts(targetId: string, sourceIds: string[]): Promise<ActionResult> {
  const target = uuid.safeParse(targetId)
  const sources = z.array(uuid).min(1).max(20).safeParse(sourceIds.filter((s) => s !== targetId))
  if (!target.success || !sources.success) return fail('בחרו לפחות שני מוצרים לאיחוד')
  const { store, claims } = await merchantContext()
  const ok = await asUser(claims, async (tx) => {
    const owned = await tx`select id from public.products where store_id = ${store.id} and id = any(${[target.data, ...sources.data]}::uuid[])`
    if (owned.length !== sources.data.length + 1) return false
    const [{ count }] = (await tx`select count(*)::int as count from public.product_images where product_id = any(${[target.data, ...sources.data]}::uuid[])`) as unknown as [{ count: number }]
    if (count > 8) return null
    await tx`update public.product_images i
             set product_id = ${target.data},
                 position = 100 + coalesce(array_position(${sources.data}::uuid[], i.product_id), 0) * 10 + i.position
             where store_id = ${store.id} and product_id = any(${sources.data}::uuid[])`
    // Keep the first filled-in name/price if the target is still empty.
    await tx`update public.products t set
               name = case when btrim(t.name) = '' then coalesce((select s.name from public.products s where s.id = any(${sources.data}::uuid[]) and btrim(s.name) <> '' limit 1), '') else t.name end,
               price_agorot = coalesce(t.price_agorot, (select s.price_agorot from public.products s where s.id = any(${sources.data}::uuid[]) and s.price_agorot is not null limit 1))
             where t.id = ${target.data}`
    await tx`delete from public.products where store_id = ${store.id} and id = any(${sources.data}::uuid[])`
    await tx`update public.product_images i set position = o.ord
             from (select id, row_number() over (order by position, created_at) as ord from public.product_images where product_id = ${target.data}) o
             where i.id = o.id`
    return true
  })
  if (ok === null) return fail('אפשר עד 8 תמונות למוצר אחד')
  if (!ok) return fail('המוצרים לא נמצאו')
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function reorderImages(productId: string, imageIds: string[]): Promise<ActionResult> {
  const pid = uuid.safeParse(productId)
  const ids = z.array(uuid).min(1).max(8).safeParse(imageIds)
  if (!pid.success || !ids.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`
    update public.product_images i set position = o.ord
    from unnest(${ids.data}::uuid[]) with ordinality as o(id, ord)
    where i.id = o.id and i.product_id = ${pid.data} and i.store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  const id = uuid.safeParse(imageId)
  if (!id.success) return fail('התמונה לא נמצאה')
  const { store, claims } = await merchantContext()
  const orphaned = await asUser(claims, async (tx) => {
    const rows = await tx<{ path: string }[]>`delete from public.product_images where id = ${id.data} and store_id = ${store.id} returning path`
    return cleanupFiles(tx, store.id, rows.map((r) => r.path))
  })
  await removeImages(orphaned)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function updateImageAlt(imageId: string, alt: string): Promise<ActionResult> {
  const id = uuid.safeParse(imageId)
  const text = z.string().trim().max(200).safeParse(alt)
  if (!id.success || !text.success) return fail('הטקסט ארוך מדי')
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`update public.product_images set alt = ${text.data} where id = ${id.data} and store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categoryName = z.string().trim().min(1, 'צריך שם לקטגוריה').max(40, 'שם הקטגוריה ארוך מדי')

export async function createCategory(name: string): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = categoryName.safeParse(name)
  if (!parsed.success) return fail(parsed.error.issues[0]!.message)
  const { store, claims } = await merchantContext()
  const row = await asUser(claims, async (tx) => {
    const [existing] = await tx<{ id: string; name: string }[]>`select id, name from public.categories where store_id = ${store.id} and name = ${parsed.data}`
    if (existing) return existing
    const [c] = await tx<{ id: string; name: string }[]>`
      insert into public.categories (store_id, name, position)
      values (${store.id}, ${parsed.data}, coalesce((select max(position) + 1 from public.categories where store_id = ${store.id}), 0))
      returning id, name`
    return c!
  })
  invalidateStorefront(store.slug)
  return { ok: true, data: row }
}

export async function renameCategory(categoryId: string, name: string): Promise<ActionResult> {
  const id = uuid.safeParse(categoryId)
  const parsed = categoryName.safeParse(name)
  if (!id.success || !parsed.success) return fail(parsed.error?.issues[0]?.message ?? 'הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  try {
    await asUser(claims, (tx) => tx`update public.categories set name = ${parsed.data} where id = ${id.data} and store_id = ${store.id}`)
  } catch {
    return fail('כבר יש קטגוריה בשם הזה')
  }
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const id = uuid.safeParse(categoryId)
  if (!id.success) return fail('הקטגוריה לא נמצאה')
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`delete from public.categories where id = ${id.data} and store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  const ids = z.array(uuid).min(1).max(100).safeParse(orderedIds)
  if (!ids.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  await asUser(claims, (tx) => tx`
    update public.categories c set position = o.ord
    from unnest(${ids.data}::uuid[]) with ordinality as o(id, ord)
    where c.id = o.id and c.store_id = ${store.id}`)
  invalidateStorefront(store.slug)
  return { ok: true }
}
