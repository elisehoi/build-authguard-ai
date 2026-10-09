import { NextResponse } from 'next/server'
import { jsonError, routeError } from '@/lib/http'
import { billingService } from '@/lib/services/billing-service'

// The one route without getUser(): Stripe calls it, not a signed-in user.
// The Stripe signature takes the place of a session as proof of identity.
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return jsonError(400, 'missing_signature', 'Missing Stripe-Signature header.')

  // Raw text, not request.json(): re-serialised JSON would not match the
  // bytes Stripe signed, and verification would fail.
  const rawBody = await request.text()

  let event
  try {
    event = billingService.constructEvent(rawBody, signature)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing or invalid environment variable')) {
      return routeError(error, 'stripe/webhook')
    }
    return jsonError(400, 'invalid_signature', 'Webhook signature verification failed.')
  }

  try {
    const outcome = await billingService.handleEvent(event)
    return NextResponse.json({ received: true, outcome })
  } catch (error) {
    // A 5xx tells Stripe to retry later.
    console.error(`[stripe/webhook] Failed to process ${event.type}: ${(error as Error).message}`)
    return jsonError(500, 'processing_failed', 'Webhook processing failed.')
  }
}
