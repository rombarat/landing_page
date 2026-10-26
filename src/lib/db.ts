import 'server-only'
import postgres from 'postgres'
import { serverEnv } from './env'

/**
 * Direct Postgres access with Row Level Security enforced per transaction.
 *
 * - asUser():   runs as the `authenticated` role with the verified user's claims,
 *               so every query is filtered by RLS exactly like a Supabase API call.
 * - asAnon():   runs as `anon` (public storefront functions only).
 * - asService(): runs as `service_role` for trusted server operations
 *               (order placement, platform admin). Callers must authorize first.
 *
 * In production DATABASE_URL should point at the Supabase pooler in transaction
 * mode (port 6543); prepared statements are therefore disabled.
 */
type Sql = postgres.Sql
export type Tx = postgres.TransactionSql

const globalForDb = globalThis as unknown as { __dukanSql?: Sql }

export function sql(): Sql {
  if (!globalForDb.__dukanSql) {
    globalForDb.__dukanSql = postgres(serverEnv.databaseUrl, {
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      onnotice: () => {},
      types: { bigint: postgres.BigInt },
    })
  }
  return globalForDb.__dukanSql
}

export type Claims = { sub: string; email?: string; role?: string }

export async function asUser<T>(claims: Claims, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql().begin(async (tx) => {
    const jwtClaims = JSON.stringify({ sub: claims.sub, email: claims.email, role: 'authenticated' })
    await tx`select set_config('request.jwt.claims', ${jwtClaims}, true), set_config('request.jwt.claim.sub', ${claims.sub}, true)`
    await tx`set local role authenticated`
    return fn(tx)
  }) as Promise<T>
}

export async function asAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql().begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', '{"role":"anon"}', true)`
    await tx`set local role anon`
    return fn(tx)
  }) as Promise<T>
}

export async function asService<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql().begin(async (tx) => {
    await tx`set local role service_role`
    return fn(tx)
  }) as Promise<T>
}

export function pgErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    return message.split(':')[0] ?? message
  }
  return null
}
