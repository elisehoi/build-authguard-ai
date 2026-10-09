'use server'

import { headers } from 'next/headers'
import { getAuthContext } from '@/lib/services/auth-context'
import { billingService } from '@/lib/services/billing-service'

export type CheckoutResult = { ok: true; url: string } | { ok: false; message: string }

export async function startCheckout(): Promise<CheckoutResult> {
  const context = await getAuthContext()
  if (!context) return { ok: false, message: 'Your session expired. Please log in again.' }

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  if (!host) return { ok: false, message: 'Could not determine the site address.' }

  try {
    const url = await billingService.createCheckoutUrl(context.user.id, context.user.email, `${protocol}://${host}`)
    return { ok: true, url }
  } catch (error) {
    console.error('[billing] Checkout failed:', (error as Error).message)
    return { ok: false, message: 'Checkout is unavailable right now. Check the Stripe configuration and try again.' }
  }
}
