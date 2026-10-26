'use client'

/**
 * Client-side image preparation: downscale and convert to WebP in the browser
 * before upload, so phones on slow networks send ~300KB instead of 5MB and the
 * request fits serverless body limits. The server still re-validates and
 * re-encodes every file.
 */
const MAX_EDGE = 2000
const MAX_SEND_BYTES = 3.8 * 1024 * 1024

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // fall through to <img> decoding (e.g. some HEIC files in Safari)
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error('הקובץ הזה לא נראה כמו תמונה.')
  }
  let source: ImageBitmap | HTMLImageElement
  try {
    source = await decode(file)
  } catch {
    if (file.size <= MAX_SEND_BYTES) return file
    throw new Error('הדפדפן לא מצליח לקרוא את התמונה. נסו לשמור אותה כ־JPG.')
  }
  const w = 'naturalWidth' in source ? source.naturalWidth : source.width
  const h = 'naturalHeight' in source ? source.naturalHeight : source.height
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  if ('close' in source) source.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
  if (blob && blob.type === 'image/webp' && blob.size <= MAX_SEND_BYTES) return blob
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (jpeg && jpeg.size <= MAX_SEND_BYTES) return jpeg
  throw new Error('התמונה גדולה מדי גם אחרי דחיסה.')
}

export type UploadedImage = { id: string; path: string; width: number; height: number; alt: string; position: number }
export type UploadResponse =
  | { type: 'product' | 'product-image'; productId: string; image: UploadedImage }
  | { type: 'logo' | 'hero'; path: string }

export async function uploadImage(
  file: File,
  kind: 'product' | 'product-image' | 'logo' | 'hero',
  productId?: string,
): Promise<UploadResponse> {
  const blob = await compressImage(file)
  const body = new FormData()
  body.set('kind', kind)
  if (productId) body.set('productId', productId)
  body.set('file', blob, blob.type === 'image/webp' ? 'image.webp' : file.name)
  let res: Response
  try {
    res = await fetch('/api/uploads', { method: 'POST', body })
  } catch {
    throw new Error('אין חיבור לרשת. בדקו את החיבור ונסו שוב.')
  }
  const json = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(json.error ?? 'ההעלאה נכשלה. נסו שוב.')
  return json as UploadResponse
}

/** Runs async tasks with a small concurrency limit. */
export function createQueue(concurrency = 3) {
  let active = 0
  const waiting: Array<() => void> = []
  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= concurrency) await new Promise<void>((resolve) => waiting.push(resolve))
    active++
    try {
      return await task()
    } finally {
      active--
      waiting.shift()?.()
    }
  }
}
