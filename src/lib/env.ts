import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

/** Server-only configuration. Never import this module from client components. */
export const serverEnv = {
  get databaseUrl() {
    return required('DATABASE_URL')
  },
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL')
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  get serviceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY')
  },
  get storageDriver(): 'supabase' | 'local' {
    return process.env.STORAGE_DRIVER === 'local' ? 'local' : 'supabase'
  },
  get orderIpSalt() {
    return process.env.ORDER_IP_SALT ?? 'dukan-default-salt-set-ORDER_IP_SALT'
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  },
}
