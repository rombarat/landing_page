import 'server-only'

/**
 * Best-effort in-memory sliding window, per server instance. It blunts bursts
 * on a single instance; the durable limits for orders live in place_order().
 * Upgrade path: swap this for a shared store (e.g. Upstash Redis) when traffic
 * justifies it.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t > windowMs)) buckets.delete(k)
  }
  return true
}
