import 'server-only'

/**
 * Billing boundary. The MVP ships without a payment provider: subscriptions are
 * activated manually by a platform admin. A real provider (e.g. an Israeli
 * processor with recurring billing) plugs in by implementing BillingProvider and
 * a webhook route that updates public.subscriptions with the service role.
 * Nothing in the app marks an account as paid because a button was clicked.
 */
export const PLAN = { name: 'דוכן', priceIls: 99, interval: 'month', trialDays: 7 } as const

export type CheckoutStart =
  | { kind: 'redirect'; url: string }
  | { kind: 'contact'; email: string | null; whatsapp: string | null }

export interface BillingProvider {
  readonly id: string
  readonly collectsPayments: boolean
  startSubscription(input: { userId: string; email?: string }): Promise<CheckoutStart>
}

class ManualBilling implements BillingProvider {
  readonly id = 'manual'
  readonly collectsPayments = false
  async startSubscription(): Promise<CheckoutStart> {
    return {
      kind: 'contact',
      email: process.env.PLATFORM_SUPPORT_EMAIL ?? null,
      whatsapp: process.env.PLATFORM_SUPPORT_WHATSAPP ?? null,
    }
  }
}

export function getBillingProvider(): BillingProvider {
  return new ManualBilling()
}
