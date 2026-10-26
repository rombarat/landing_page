/** Client-safe helpers for building public media URLs. */
export type MediaVariant = 'full' | 'thumb'
export const MEDIA_SIZES: Record<MediaVariant, number> = { full: 1600, thumb: 640 }

function base(): string {
  const explicit = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')}/storage/v1/object/public/store-media`
}

export function mediaUrl(path: string | null | undefined, variant: MediaVariant = 'full'): string | null {
  if (!path) return null
  return `${base()}/${path}-${MEDIA_SIZES[variant]}.webp`
}

export function mediaSrcSet(path: string): string {
  return `${mediaUrl(path, 'thumb')} ${MEDIA_SIZES.thumb}w, ${mediaUrl(path, 'full')} ${MEDIA_SIZES.full}w`
}
