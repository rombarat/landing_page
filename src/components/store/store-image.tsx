import { mediaSrcSet, mediaUrl } from '@/lib/media'
import type { PublicImage } from '@/lib/types'

/** Responsive WebP image with intrinsic size (no layout shift) and lazy loading. */
export function StoreImage({
  image,
  alt,
  sizes,
  priority,
  className,
}: {
  image: PublicImage | { path: string; width?: number; height?: number; alt?: string }
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(image.path, 'full')!}
      srcSet={mediaSrcSet(image.path)}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt || alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className ?? 'size-full object-cover'}
    />
  )
}
