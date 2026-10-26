import 'server-only'
import sharp, { type Metadata } from 'sharp'
import { MEDIA_SIZES } from './media'

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff'])

export class ImageRejectedError extends Error {}

/**
 * Decodes an untrusted upload, verifies it is a real raster image, strips all
 * metadata (EXIF/GPS) and re-encodes it into WebP variants. Nothing from the
 * original file is served as-is.
 */
export async function processImage(input: Buffer) {
  if (input.byteLength === 0) throw new ImageRejectedError('empty')
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new ImageRejectedError('too_large')

  let meta: Metadata
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata()
  } catch {
    throw new ImageRejectedError('not_an_image')
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) throw new ImageRejectedError('unsupported_format')
  if (!meta.width || !meta.height || meta.width < 200 || meta.height < 200) throw new ImageRejectedError('too_small')

  const pipeline = sharp(input, { limitInputPixels: 60_000_000, failOn: 'error' }).rotate()
  const full = await pipeline
    .clone()
    .resize({ width: MEDIA_SIZES.full, height: MEDIA_SIZES.full, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer({ resolveWithObject: true })
  const thumb = await pipeline
    .clone()
    .resize({ width: MEDIA_SIZES.thumb, height: MEDIA_SIZES.thumb, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76, effort: 4 })
    .toBuffer()

  return {
    width: full.info.width,
    height: full.info.height,
    bytes: full.data.byteLength + thumb.byteLength,
    variants: [
      { suffix: String(MEDIA_SIZES.full), body: full.data },
      { suffix: String(MEDIA_SIZES.thumb), body: thumb },
    ],
  }
}
