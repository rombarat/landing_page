import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getClaims, getMerchantStore } from '@/lib/auth'
import { invalidateStorefront } from '@/lib/data/storefront'
import { asUser } from '@/lib/db'
import { ImageRejectedError, MAX_UPLOAD_BYTES, processImage } from '@/lib/images'
import { rateLimit } from '@/lib/rate-limit'
import { putImageVariants, removeImages } from '@/lib/storage'

export const runtime = 'nodejs'

const MAX_PRODUCTS = 300
const MAX_IMAGES_PER_PRODUCT = 8

const REJECT_MESSAGES: Record<string, string> = {
  empty: 'הקובץ ריק.',
  too_large: 'התמונה גדולה מדי (עד 4MB אחרי דחיסה).',
  not_an_image: 'הקובץ הזה לא נראה כמו תמונה.',
  unsupported_format: 'סוג הקובץ לא נתמך. אפשר JPG, PNG, WebP או HEIC.',
  too_small: 'התמונה קטנה מדי. כדאי תמונה של לפחות 200 פיקסלים.',
}

const fieldsSchema = z.object({
  kind: z.enum(['product', 'product-image', 'logo', 'hero']),
  productId: z.string().uuid().optional(),
})

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const claims = await getClaims()
  if (!claims) return error('צריך להתחבר מחדש.', 401)
  const store = await getMerchantStore(claims)
  if (!store) return error('לא נמצאה חנות לחשבון.', 403)
  if (!rateLimit(`upload:${claims.sub}`, 150, 10 * 60_000)) return error('העליתם הרבה תמונות ברצף. חכו כמה דקות ונסו שוב.', 429)

  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return error(REJECT_MESSAGES.too_large!, 413)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return error('ההעלאה נקטעה. נסו שוב.')
  }
  const fields = fieldsSchema.safeParse({ kind: form.get('kind'), productId: form.get('productId') || undefined })
  const file = form.get('file')
  if (!fields.success || !(file instanceof File)) return error('הבקשה לא תקינה.')

  let processed: Awaited<ReturnType<typeof processImage>>
  try {
    processed = await processImage(Buffer.from(await file.arrayBuffer()))
  } catch (e) {
    if (e instanceof ImageRejectedError) return error(REJECT_MESSAGES[e.message] ?? 'התמונה לא התקבלה.')
    console.error('image processing failed', e)
    return error('לא הצלחנו לעבד את התמונה. נסו תמונה אחרת.')
  }

  const { kind, productId } = fields.data
  const folder = kind === 'logo' || kind === 'hero' ? 'brand' : 'products'
  const basePath = `${store.id}/${folder}/${randomUUID()}`
  try {
    await putImageVariants(basePath, processed.variants)
  } catch (e) {
    console.error(e)
    return error('שמירת התמונה נכשלה. נסו שוב בעוד רגע.', 502)
  }

  try {
    const result = await asUser(claims, async (tx) => {
      if (kind === 'logo' || kind === 'hero') {
        const [prev] =
          kind === 'logo'
            ? await tx<{ old: string | null }[]>`select logo_path as old from public.stores where id = ${store.id}`
            : await tx<{ old: string | null }[]>`select hero_image_path as old from public.store_settings where store_id = ${store.id}`
        if (kind === 'logo') await tx`update public.stores set logo_path = ${basePath} where id = ${store.id}`
        else await tx`update public.store_settings set hero_image_path = ${basePath} where store_id = ${store.id}`
        return { type: kind, path: basePath, replaced: prev?.old ?? null }
      }

      let targetId = productId
      if (kind === 'product') {
        const [{ count }] = (await tx`select count(*)::int as count from public.products where store_id = ${store.id}`) as unknown as [{ count: number }]
        if (count >= MAX_PRODUCTS) throw new Error('limit_products')
        const [p] = await tx<{ id: string }[]>`
          insert into public.products (store_id, slug, position)
          values (${store.id}, ${'item-' + randomUUID().slice(0, 8)},
                  coalesce((select max(position) + 1 from public.products where store_id = ${store.id}), 0))
          returning id`
        targetId = p!.id
      } else {
        const [{ count }] = (await tx`select count(*)::int as count from public.product_images where product_id = ${productId ?? null} and store_id = ${store.id}`) as unknown as [{ count: number }]
        const [owned] = await tx`select 1 from public.products where id = ${productId ?? null} and store_id = ${store.id}`
        if (!owned) throw new Error('not_found')
        if (count >= MAX_IMAGES_PER_PRODUCT) throw new Error('limit_images')
      }
      const [image] = await tx<{ id: string; position: number }[]>`
        insert into public.product_images (store_id, product_id, path, width, height, bytes, position)
        values (${store.id}, ${targetId!}, ${basePath}, ${processed.width}, ${processed.height}, ${processed.bytes},
                coalesce((select max(position) + 1 from public.product_images where product_id = ${targetId!}), 0))
        returning id, position`
      return { type: kind, productId: targetId!, image: { id: image!.id, path: basePath, width: processed.width, height: processed.height, alt: '', position: image!.position } }
    })
    if ('replaced' in result && result.replaced) await removeImages([result.replaced])
    invalidateStorefront(store.slug)
    return NextResponse.json(result)
  } catch (e) {
    await removeImages([basePath])
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'limit_products') return error(`אפשר עד ${MAX_PRODUCTS} מוצרים בחנות.`, 409)
    if (msg === 'limit_images') return error(`אפשר עד ${MAX_IMAGES_PER_PRODUCT} תמונות למוצר.`, 409)
    if (msg === 'not_found') return error('המוצר לא נמצא.', 404)
    console.error('upload db failure', e)
    return error('שמירת התמונה נכשלה. נסו שוב.', 500)
  }
}
