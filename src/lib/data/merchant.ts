import 'server-only'
import { asUser, type Claims } from '../db'
import type { AccountStatus, OrderStatus, ProductStatus } from '../types'

export type EditorImage = { id: string; path: string; width: number; height: number; alt: string; position: number }
export type EditorProduct = {
  id: string
  name: string
  slug: string
  description: string
  price_agorot: number | null
  status: ProductStatus
  in_stock: boolean
  is_featured: boolean
  category_id: string | null
  position: number
  images: EditorImage[]
}
export type EditorCategory = { id: string; name: string; position: number; product_count: number }

export async function loadCatalog(claims: Claims, storeId: string, opts: { includeArchived?: boolean } = {}) {
  return asUser(claims, async (tx) => {
    const products = await tx<EditorProduct[]>`
      select p.id, p.name, p.slug, p.description, p.price_agorot, p.status, p.in_stock, p.is_featured, p.category_id, p.position,
             coalesce((select json_agg(json_build_object('id', i.id, 'path', i.path, 'width', i.width, 'height', i.height,
                                                         'alt', i.alt, 'position', i.position) order by i.position, i.created_at)
                       from public.product_images i where i.product_id = p.id), '[]'::json) as images
      from public.products p
      where p.store_id = ${storeId} ${opts.includeArchived ? tx`` : tx`and p.status <> 'archived'`}
      order by p.position, p.created_at`
    const categories = await tx<EditorCategory[]>`
      select c.id, c.name, c.position,
             (select count(*)::int from public.products p where p.category_id = c.id and p.status <> 'archived') as product_count
      from public.categories c where c.store_id = ${storeId}
      order by c.position, c.name`
    return { products: [...products], categories: [...categories] }
  })
}

export async function loadAccountStatus(claims: Claims): Promise<AccountStatus | null> {
  const [row] = await asUser(claims, (tx) => tx`select public.my_account_status() as s`)
  return (row?.s ?? null) as AccountStatus | null
}

export type OrderRow = {
  id: string
  order_number: number
  status: OrderStatus
  customer_name: string
  customer_phone: string
  customer_email: string | null
  pickup_at: Date | null
  notes: string
  total_agorot: number
  item_count: number
  created_at: Date
  status_updated_at: Date
}

export async function loadOrders(claims: Claims, storeId: string, status?: OrderStatus | 'open', limit = 200) {
  return asUser(claims, (tx) => tx<OrderRow[]>`
    select id, order_number, status, customer_name, customer_phone, customer_email, pickup_at, notes,
           total_agorot, item_count, created_at, status_updated_at
    from public.orders
    where store_id = ${storeId}
      ${status === 'open' ? tx`and status in ('new', 'confirmed', 'preparing', 'ready')` : status ? tx`and status = ${status}` : tx``}
    order by created_at desc
    limit ${limit}`)
}

export async function loadOrder(claims: Claims, storeId: string, orderId: string) {
  return asUser(claims, async (tx) => {
    const [order] = await tx<OrderRow[]>`
      select id, order_number, status, customer_name, customer_phone, customer_email, pickup_at, notes,
             total_agorot, item_count, created_at, status_updated_at
      from public.orders where id = ${orderId} and store_id = ${storeId}`
    if (!order) return null
    const items = await tx<{ id: string; product_id: string | null; product_name: string; unit_price_agorot: number; quantity: number; line_total_agorot: number }[]>`
      select id, product_id, product_name, unit_price_agorot, quantity, line_total_agorot
      from public.order_items where order_id = ${orderId} order by id`
    return { order, items: [...items] }
  })
}

export async function loadOverview(claims: Claims, storeId: string) {
  return asUser(claims, async (tx) => {
    const [stats] = await tx<{ total: number; new_count: number; open_count: number; order_value: number; products_active: number; products_total: number; last_order_at: Date | null }[]>`
      select
        (select count(*)::int from public.orders where store_id = ${storeId}) as total,
        (select count(*)::int from public.orders where store_id = ${storeId} and status = 'new') as new_count,
        (select count(*)::int from public.orders where store_id = ${storeId} and status in ('new','confirmed','preparing','ready')) as open_count,
        (select coalesce(sum(total_agorot), 0)::int from public.orders where store_id = ${storeId} and status <> 'canceled') as order_value,
        (select count(*)::int from public.products where store_id = ${storeId} and status = 'active') as products_active,
        (select count(*)::int from public.products where store_id = ${storeId} and status <> 'archived') as products_total,
        (select max(created_at) from public.orders where store_id = ${storeId}) as last_order_at`
    return stats!
  })
}
