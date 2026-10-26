import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serverEnv } from '../env'

/** Per-request Supabase client bound to the auth cookies (Auth only; data goes through lib/db). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component: proxy.ts refreshes the session instead.
        }
      },
    },
  })
}
