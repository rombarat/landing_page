// Applies supabase/migrations/*.sql in order to DATABASE_URL.
// Tracks applied versions in supabase_migrations.schema_migrations — the same
// table the Supabase CLI uses, so `supabase db push` stays consistent.
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(url, { max: 1, onnotice: () => {} })
const dir = path.resolve(import.meta.dirname, '..', 'supabase', 'migrations')

try {
  await sql`create schema if not exists supabase_migrations`
  await sql`create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text)`
  const applied = new Set((await sql`select version from supabase_migrations.schema_migrations`).map((r) => r.version))
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const [version, ...rest] = file.replace(/\.sql$/, '').split('_')
    if (applied.has(version)) continue
    const body = await readFile(path.join(dir, file), 'utf8')
    await sql.begin(async (tx) => {
      await tx.unsafe(body)
      await tx`insert into supabase_migrations.schema_migrations (version, name, statements)
               values (${version}, ${rest.join('_')}, ${[body]})`
    })
    console.log(`applied ${file}`)
  }
  console.log('migrations up to date')
} finally {
  await sql.end()
}
