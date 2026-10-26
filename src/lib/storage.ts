import 'server-only'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from './env'
import { MEDIA_SIZES } from './media'

/**
 * Media storage. Production uses Supabase Storage (public-read bucket, writes
 * with the service role from the server only). Local development stores files
 * under .local/storage and serves them from /api/storage.
 */
export const BUCKET = 'store-media'
export const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), '.local', 'storage')

type Variant = { suffix: string; body: Buffer }

function supabaseAdmin() {
  return createClient(serverEnv.supabaseUrl, serverEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function variantKeys(basePath: string): string[] {
  return Object.values(MEDIA_SIZES).map((size) => `${basePath}-${size}.webp`)
}

export async function putImageVariants(basePath: string, variants: Variant[]): Promise<void> {
  if (serverEnv.storageDriver === 'local') {
    for (const v of variants) {
      const file = path.join(LOCAL_STORAGE_DIR, `${basePath}-${v.suffix}.webp`)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, v.body)
    }
    return
  }
  const bucket = supabaseAdmin().storage.from(BUCKET)
  for (const v of variants) {
    const { error } = await bucket.upload(`${basePath}-${v.suffix}.webp`, v.body, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) throw new Error(`storage_upload_failed: ${error.message}`)
  }
}

export async function removeImages(basePaths: Array<string | null | undefined>): Promise<void> {
  const keys = basePaths.filter((p): p is string => Boolean(p)).flatMap(variantKeys)
  if (keys.length === 0) return
  if (serverEnv.storageDriver === 'local') {
    await Promise.all(keys.map((k) => rm(path.join(LOCAL_STORAGE_DIR, k), { force: true })))
    return
  }
  const { error } = await supabaseAdmin().storage.from(BUCKET).remove(keys)
  if (error) console.error('storage remove failed', error.message)
}

/** Lists stored base paths (without size suffix) under a store folder, with their age. */
export async function listStoreImages(storeId: string): Promise<Array<{ basePath: string; createdAt: Date }>> {
  const results = new Map<string, Date>()
  for (const kind of ['products', 'brand']) {
    const prefix = `${storeId}/${kind}`
    if (serverEnv.storageDriver === 'local') {
      const dir = path.join(LOCAL_STORAGE_DIR, prefix)
      const files = await readdir(dir).catch(() => [] as string[])
      for (const f of files) {
        const s = await stat(path.join(dir, f))
        results.set(`${prefix}/${f.replace(/-\d+\.webp$/, '')}`, s.mtime)
      }
      continue
    }
    const { data } = await supabaseAdmin().storage.from(BUCKET).list(prefix, { limit: 1000 })
    for (const obj of data ?? []) {
      results.set(`${prefix}/${obj.name.replace(/-\d+\.webp$/, '')}`, new Date(obj.created_at ?? Date.now()))
    }
  }
  return [...results].map(([basePath, createdAt]) => ({ basePath, createdAt }))
}
