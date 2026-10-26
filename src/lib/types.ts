import type { FontPresetKey, TemplateKey } from './themes'

export type OrderGate = 'ok' | 'suspended' | 'not_published' | 'paused' | 'subscription_inactive'

export type PublicImage = { path: string; width: number; height: number; alt: string }

export type PublicProduct = {
  id: string
  slug: string
  name: string
  description: string
  price_agorot: number
  in_stock: boolean
  is_featured: boolean
  category_id: string | null
  images: PublicImage[]
}

export type StoreSettings = {
  template: TemplateKey
  font_preset: FontPresetKey
  color_primary: string
  color_accent: string
  hero_title: string
  hero_subtitle: string
  hero_image_path: string | null
  about_title: string
  about_text: string
  pickup_address: string
  pickup_instructions: string
  pickup_requires_slot: boolean
  pickup_lead_hours: number
  payment_note: string
  updated_at: string
}

export type StorePayload = {
  store: {
    id: string
    slug: string
    name: string
    category: string
    description: string
    phone: string | null
    whatsapp: string | null
    contact_email: string | null
    instagram: string | null
    logo_path: string | null
    status: 'draft' | 'published' | 'unpublished'
    updated_at: string
  }
  settings: StoreSettings
  order_gate: OrderGate
  categories: Array<{ id: string; name: string }>
  products: PublicProduct[]
}

export const ORDER_STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'canceled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'חדשה',
  confirmed: 'אושרה',
  preparing: 'בהכנה',
  ready: 'מוכנה לאיסוף',
  completed: 'הושלמה',
  canceled: 'בוטלה',
}

export const ORDER_STATUS_TONE: Record<OrderStatus, 'info' | 'brand' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  new: 'brand',
  confirmed: 'info',
  preparing: 'warning',
  ready: 'success',
  completed: 'neutral',
  canceled: 'danger',
}

export type ProductStatus = 'draft' | 'active' | 'hidden' | 'archived'

export type AccountStatus = {
  status: 'not_started' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  effective: 'not_started' | 'trialing' | 'active' | 'past_due' | 'expired'
  trial_started_at: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  server_now: string
  trial_days_left: number | null
}
