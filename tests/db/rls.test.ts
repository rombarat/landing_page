/**
 * Tenant isolation, authorization and order-logic tests against a real Postgres
 * with the production migrations applied (see scripts/local-stack.sh).
 * Each query runs under the same role switching the app uses (src/lib/db.ts).
 */
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const env = readFileSync('.env.local', 'utf8')
  return /^DATABASE_URL=(.*)$/m.exec(env)?.[1] ?? ''
}

const sql = postgres(databaseUrl(), { max: 4, onnotice: () => {} })
type Tx = postgres.TransactionSql

const run = Date.now().toString(36)
const userA = randomUUID()
const userB = randomUUID()
let storeA = ''
let storeB = ''
let productA = ''
let productB = ''
let categoryB = ''

async function as<T>(user: string | 'anon' | 'service', fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    if (user === 'anon') {
      await tx`set local role anon`
    } else if (user === 'service') {
      await tx`set local role service_role`
    } else {
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: user, role: 'authenticated' })}, true)`
      await tx`set local role authenticated`
    }
    return fn(tx)
  }) as Promise<T>
}

async function expectError(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toThrow(pattern)
}

function order(slug: string, items: { product_id: string; quantity: number }[], opts: { key?: string; ip?: string } = {}) {
  return as('service', (tx) =>
    tx`select public.place_order(${slug}, ${'ישראלה ישראלי'}, ${'050-1234567'}, ${''}, ${null}, ${'בלי אגוזים'},
         ${tx.json(items)}, ${opts.key ?? randomUUID()}, ${opts.ip ?? randomUUID()}) as r`.then((r) => r[0]!.r as {
      order_number: number
      token: string
      duplicate: boolean
    }),
  )
}

beforeAll(async () => {
  for (const [id, email] of [
    [userA, `a-${run}@test.local`],
    [userB, `b-${run}@test.local`],
  ] as const) {
    await sql`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_user_meta_data)
              values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${email}, '', now(), now(), '{}'::jsonb)`
  }
  storeA = await as(userA, (tx) =>
    tx`select public.create_store(${'עוגות של לינוי'}, ${`linoy-${run}`}, 'bakery', 'עוגות ביתיות', '050-1111111', null) as id`.then(
      (r) => r[0]!.id as string,
    ),
  )
  storeB = await as(userB, (tx) =>
    tx`select public.create_store(${'קרמיקה של דנה'}, ${`dana-${run}`}, 'ceramics', '', '050-2222222', null) as id`.then(
      (r) => r[0]!.id as string,
    ),
  )
  productA = await as(userA, (tx) =>
    tx`insert into public.products (store_id, name, slug, price_agorot, status)
       values (${storeA}, 'עוגת שוקולד', 'ugat-shokolad', 12000, 'active') returning id`.then((r) => r[0]!.id as string),
  )
  ;[productB, categoryB] = await as(userB, async (tx) => {
    const [c] = await tx`insert into public.categories (store_id, name) values (${storeB}, 'קערות') returning id`
    const [p] = await tx`insert into public.products (store_id, name, slug, price_agorot, status, category_id)
       values (${storeB}, 'קערה כחולה', 'kaara', 9000, 'active', ${c!.id}) returning id`
    return [p!.id as string, c!.id as string]
  })
})

afterAll(async () => {
  await sql`delete from auth.users where id in (${userA}, ${userB})`
  await sql.end()
})

describe('tenant isolation', () => {
  it('merchant reads only their own store, products and settings', async () => {
    const res = await as(userA, async (tx) => ({
      stores: await tx`select id from public.stores`,
      products: await tx`select id from public.products`,
      settings: await tx`select store_id from public.store_settings`,
      categories: await tx`select id from public.categories`,
    }))
    expect(res.stores.map((r) => r.id)).toEqual([storeA])
    expect(res.products.map((r) => r.id)).toEqual([productA])
    expect(res.settings.map((r) => r.store_id)).toEqual([storeA])
    expect(res.categories).toHaveLength(0)
  })

  it('merchant cannot insert products into another store', async () => {
    await expectError(
      as(userA, (tx) => tx`insert into public.products (store_id, name, slug) values (${storeB}, 'x', 'x')`),
      /row-level security/,
    )
  })

  it('merchant cannot update or delete another store’s products', async () => {
    const updated = await as(userA, (tx) => tx`update public.products set price_agorot = 1 where id = ${productB} returning id`)
    const deleted = await as(userA, (tx) => tx`delete from public.products where id = ${productB} returning id`)
    expect(updated).toHaveLength(0)
    expect(deleted).toHaveLength(0)
    const [p] = await sql`select price_agorot from public.products where id = ${productB}`
    expect(p!.price_agorot).toBe(9000)
  })

  it('merchant cannot move a product into another store or attach a foreign category', async () => {
    const moved = await as(userA, (tx) => tx`update public.products set store_id = ${storeB} where id = ${productA} returning id`).catch(
      (e: Error) => e,
    )
    expect(moved instanceof Error ? moved.message : 'no error').toMatch(/row-level security/)
    await expectError(
      as(userA, (tx) => tx`update public.products set category_id = ${categoryB} where id = ${productA}`),
      /foreign key/,
    )
  })

  it('image paths must live inside the store’s own folder', async () => {
    await expectError(
      as(userA, (tx) => tx`insert into public.product_images (store_id, product_id, path, width, height)
                           values (${storeA}, ${productA}, ${`${storeB}/products/${randomUUID()}`}, 10, 10)`),
      /path_in_store_folder/,
    )
  })

  it('merchant cannot change privileged store columns directly', async () => {
    await expectError(as(userA, (tx) => tx`update public.stores set status = 'published' where id = ${storeA}`), /permission denied/)
    await expectError(as(userA, (tx) => tx`update public.stores set suspended_at = null where id = ${storeA}`), /permission denied/)
    await expectError(as(userA, (tx) => tx`update public.stores set owner_id = ${userB} where id = ${storeA}`), /permission denied/)
  })

  it('merchant cannot touch subscriptions or admin tables', async () => {
    await expectError(
      as(userA, (tx) => tx`update public.subscriptions set status = 'active' where user_id = ${userA}`),
      /permission denied/,
    )
    await expectError(as(userA, (tx) => tx`insert into public.platform_admins (user_id) values (${userA})`), /permission denied/)
    await expectError(as(userA, (tx) => tx`select * from public.platform_admins`), /permission denied/)
    const subs = await as(userA, (tx) => tx`select user_id from public.subscriptions`)
    expect(subs.map((r) => r.user_id)).toEqual([userA])
  })

  it('merchant cannot create a second store', async () => {
    await expectError(
      as(userA, (tx) => tx`select public.create_store('עוד חנות', ${`second-${run}`}, 'other', '', null, null)`),
      /store_exists/,
    )
  })

  it('anon has no direct table access', async () => {
    for (const table of ['stores', 'products', 'orders', 'order_items', 'store_settings', 'subscriptions', 'profiles']) {
      await expectError(as('anon', (tx) => tx.unsafe(`select * from public.${table} limit 1`)), /permission denied/)
    }
  })

  it('API roles cannot call place_order directly', async () => {
    await expectError(
      as('anon', (tx) => tx`select public.place_order('x', 'x', 'x', null, null, null, '[]'::jsonb, ${randomUUID()}, null)`),
      /permission denied/,
    )
    await expectError(
      as(userA, (tx) => tx`select public.place_order('x', 'x', 'x', null, null, null, '[]'::jsonb, ${randomUUID()}, null)`),
      /permission denied/,
    )
  })
})

describe('publishing and the public storefront', () => {
  it('unpublished stores are not public', async () => {
    const [r] = await as('anon', (tx) => tx`select public.public_store(${`linoy-${run}`}) as s`)
    expect(r!.s).toBeNull()
  })

  it('publish validates required data', async () => {
    const draft = await as(userA, (tx) => tx`update public.products set status = 'draft' where id = ${productA}`)
    expect(draft.count).toBe(1)
    const [r] = await as(userA, (tx) => tx`select public.publish_store(${storeA}) as r`)
    expect(r!.r).toEqual({ ok: false, errors: ['no_active_products'] })
    await as(userA, (tx) => tx`update public.products set status = 'active' where id = ${productA}`)
  })

  it('another merchant cannot publish my store', async () => {
    await expectError(as(userB, (tx) => tx`select public.publish_store(${storeA})`), /forbidden/)
  })

  it('first publish starts a single 7-day trial that cannot be reset', async () => {
    const [r] = await as(userA, (tx) => tx`select public.publish_store(${storeA}) as r`)
    expect(r!.r.ok).toBe(true)
    const [s1] = await sql`select status, trial_started_at, trial_ends_at from public.subscriptions where user_id = ${userA}`
    expect(s1!.status).toBe('trialing')
    const days = (s1!.trial_ends_at.getTime() - s1!.trial_started_at.getTime()) / 86_400_000
    expect(days).toBeCloseTo(7, 5)

    await as(userA, (tx) => tx`select public.unpublish_store(${storeA})`)
    await as(userA, (tx) => tx`select public.publish_store(${storeA})`)
    const [s2] = await sql`select trial_started_at from public.subscriptions where user_id = ${userA}`
    expect(s2!.trial_started_at.getTime()).toBe(s1!.trial_started_at.getTime())

    const [status] = await as(userA, (tx) => tx`select public.my_account_status() as s`)
    expect(status!.s.effective).toBe('trialing')
    expect(status!.s.trial_days_left).toBe(7)
  })

  it('public payload exposes only public fields', async () => {
    const [r] = await as('anon', (tx) => tx`select public.public_store(${`linoy-${run}`}) as s`)
    const payload = r!.s
    expect(payload.store.name).toBe('עוגות של לינוי')
    expect(payload.products).toHaveLength(1)
    expect(payload.order_gate).toBe('ok')
    const text = JSON.stringify(payload)
    expect(text).not.toContain('owner_id')
    expect(text).not.toContain('next_order_number')
    expect(text).not.toContain(userA)
  })

  it('hidden products are not public', async () => {
    const hidden = await as(userA, (tx) =>
      tx`insert into public.products (store_id, name, slug, price_agorot, status) values (${storeA}, 'סוד', 'sod', 100, 'hidden') returning id`,
    )
    const [r] = await as('anon', (tx) => tx`select public.public_store(${`linoy-${run}`}) as s`)
    expect(r!.s.products.map((p: { id: string }) => p.id)).not.toContain(hidden[0]!.id)
  })

  it('slug changes keep old links working and protect the old slug', async () => {
    await as(userA, (tx) => tx`select public.change_store_slug(${storeA}, ${`linoy-cakes-${run}`})`)
    const [r] = await as('anon', (tx) => tx`select public.public_store(${`linoy-${run}`}) as s`)
    expect(r!.s).toEqual({ redirect: `linoy-cakes-${run}` })
    await expectError(as(userB, (tx) => tx`select public.change_store_slug(${storeB}, ${`linoy-${run}`})`), /slug_taken/)
    await expectError(as(userB, (tx) => tx`select public.change_store_slug(${storeA}, ${`hijack-${run}`})`), /forbidden/)
  })

  it('merchant preview works for own unpublished store only', async () => {
    const [own] = await as(userB, (tx) => tx`select public.store_preview(${storeB}) as s`)
    expect(own!.s.store.status).toBe('draft')
    await expectError(as(userA, (tx) => tx`select public.store_preview(${storeB})`), /forbidden/)
  })
})

describe('orders', () => {
  const slug = () => `linoy-cakes-${run}`

  it('prices and totals are computed from the database', async () => {
    const res = await order(slug(), [
      { product_id: productA, quantity: 2 },
      { product_id: productA, quantity: 1 },
    ])
    expect(res.order_number).toBe(1001)
    const [o] = await sql`select total_agorot, item_count from public.orders where public_token = ${res.token}`
    expect(o).toEqual({ total_agorot: 36000, item_count: 3 })
  })

  it('duplicate submissions return the original order', async () => {
    const key = randomUUID()
    const first = await order(slug(), [{ product_id: productA, quantity: 1 }], { key })
    const second = await order(slug(), [{ product_id: productA, quantity: 1 }], { key })
    expect(second.order_number).toBe(first.order_number)
    expect(second.duplicate).toBe(true)
  })

  it('rejects products from another store and unavailable products', async () => {
    await expectError(order(slug(), [{ product_id: productB, quantity: 1 }]), /product_unavailable/)
    await as(userA, (tx) => tx`update public.products set in_stock = false where id = ${productA}`)
    await expectError(order(slug(), [{ product_id: productA, quantity: 1 }]), /product_unavailable/)
    await as(userA, (tx) => tx`update public.products set in_stock = true where id = ${productA}`)
  })

  it('rejects stores that are not published', async () => {
    await expectError(order(`dana-${run}`, [{ product_id: productB, quantity: 1 }]), /store_closed:not_published/)
  })

  it('only the store’s merchant sees its orders and customer details', async () => {
    const a = await as(userA, (tx) => tx`select customer_phone from public.orders`)
    const b = await as(userB, (tx) => tx`select customer_phone from public.orders`)
    const bItems = await as(userB, (tx) => tx`select id from public.order_items`)
    expect(a.length).toBeGreaterThan(0)
    expect(b).toHaveLength(0)
    expect(bItems).toHaveLength(0)
  })

  it('merchant can change status but not amounts; others cannot change it at all', async () => {
    const [o] = await sql`select id from public.orders where store_id = ${storeA} order by order_number limit 1`
    const ok = await as(userA, (tx) => tx`update public.orders set status = 'confirmed' where id = ${o!.id} returning status`)
    expect(ok[0]!.status).toBe('confirmed')
    await expectError(as(userA, (tx) => tx`update public.orders set total_agorot = 1 where id = ${o!.id}`), /permission denied/)
    const other = await as(userB, (tx) => tx`update public.orders set status = 'canceled' where id = ${o!.id} returning id`)
    expect(other).toHaveLength(0)
    await expectError(as(userA, (tx) => tx`delete from public.orders where id = ${o!.id}`), /permission denied/)
  })

  it('order confirmation exposes no customer contact details', async () => {
    const res = await order(slug(), [{ product_id: productA, quantity: 1 }])
    const [r] = await as('anon', (tx) => tx`select public.order_confirmation(${res.token}) as c`)
    expect(r!.c.order_number).toBe(res.order_number)
    expect(r!.c.customer_first_name).toBe('ישראלה')
    expect(JSON.stringify(r!.c)).not.toContain('050-1234567')
  })

  it('rate-limits repeated orders from the same client', async () => {
    const ip = `ip-${run}`
    for (let i = 0; i < 5; i++) await order(slug(), [{ product_id: productA, quantity: 1 }], { ip })
    await expectError(order(slug(), [{ product_id: productA, quantity: 1 }], { ip }), /rate_limited/)
  })

  it('validates customer details', async () => {
    await expectError(
      as('service', (tx) =>
        tx`select public.place_order(${slug()}, 'א', '050-1234567', null, null, null, ${tx.json([{ product_id: productA, quantity: 1 }])}, ${randomUUID()}, null)`,
      ),
      /invalid_name/,
    )
    await expectError(
      as('service', (tx) =>
        tx`select public.place_order(${slug()}, 'דני כהן', '12', null, null, null, ${tx.json([{ product_id: productA, quantity: 1 }])}, ${randomUUID()}, null)`,
      ),
      /invalid_phone/,
    )
  })
})

describe('trial expiration and activation', () => {
  it('expired trial stops new orders but keeps data', async () => {
    await sql`update public.subscriptions set trial_started_at = now() - interval '8 days', trial_ends_at = now() - interval '1 day' where user_id = ${userA}`
    const [status] = await as(userA, (tx) => tx`select public.my_account_status() as s`)
    expect(status!.s.effective).toBe('expired')
    await expectError(order(`linoy-cakes-${run}`, [{ product_id: productA, quantity: 1 }]), /store_closed:subscription_inactive/)
    const orders = await as(userA, (tx) => tx`select id from public.orders`)
    expect(orders.length).toBeGreaterThan(0)
    const [pub] = await as('anon', (tx) => tx`select public.public_store(${`linoy-cakes-${run}`}) as s`)
    expect(pub!.s.order_gate).toBe('subscription_inactive')
  })

  it('manual activation re-opens ordering', async () => {
    await sql`update public.subscriptions set status = 'active', current_period_end = now() + interval '30 days' where user_id = ${userA}`
    const res = await order(`linoy-cakes-${run}`, [{ product_id: productA, quantity: 1 }])
    expect(res.order_number).toBeGreaterThan(1000)
  })

  it('suspended stores disappear from public view', async () => {
    await sql`update public.stores set suspended_at = now() where id = ${storeA}`
    const [pub] = await as('anon', (tx) => tx`select public.public_store(${`linoy-cakes-${run}`}) as s`)
    expect(pub!.s).toBeNull()
    await sql`update public.stores set suspended_at = null where id = ${storeA}`
  })
})
