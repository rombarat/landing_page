import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { LOCAL_STORAGE_DIR } from '@/lib/storage'

/** Serves locally stored media in development (STORAGE_DRIVER=local). */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.STORAGE_DRIVER !== 'local') return new NextResponse(null, { status: 404 })
  const parts = (await params).path
  const rel = parts.join('/')
  if (!/^[0-9a-f-]{36}\/(products|brand)\/[0-9a-f-]{36}-\d+\.webp$/.test(rel)) return new NextResponse(null, { status: 404 })
  const file = path.join(LOCAL_STORAGE_DIR, rel)
  try {
    const body = await readFile(file)
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'content-type': 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
