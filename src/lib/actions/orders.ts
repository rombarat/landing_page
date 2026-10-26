'use server'

import { z } from 'zod'
import { asUser } from '../db'
import { fail, merchantContext, type ActionResult } from '../merchant'
import { ORDER_STATUSES } from '../types'

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  const id = z.string().uuid().safeParse(orderId)
  const st = z.enum(ORDER_STATUSES).safeParse(status)
  if (!id.success || !st.success) return fail('הבקשה לא תקינה')
  const { store, claims } = await merchantContext()
  const rows = await asUser(claims, (tx) => tx`
    update public.orders set status = ${st.data} where id = ${id.data} and store_id = ${store.id} returning id`)
  if (rows.length === 0) return fail('ההזמנה לא נמצאה')
  return { ok: true }
}
