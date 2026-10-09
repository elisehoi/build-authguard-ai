import 'server-only'
import type Stripe from 'stripe'
import { getServerEnv } from '@/lib/env'
import { ProfilesRepository } from '@/lib/repositories/profiles-repository'
import { StripeEventsRepository } from '@/lib/repositories/stripe-events-repository'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export type WebhookOutcome = 'processed' | 'duplicate' | 'ignored'

export class BillingService {
  // The price comes from STRIPE_PRICE_ID on the server, never from the
  // browser, so a user cannot change what they pay. client_reference_id
  // carries the user id to the webhook.
  async createCheckoutUrl(userId: string, email: string | undefined, origin: string): Promise<string> {
    const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID } = getServerEnv('stripeCheckout')
    const session = await getStripe(STRIPE_SECRET_KEY).checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        client_reference_id: userId,
        customer_email: email,
        success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/billing/cancel`,
      },
      // Same user, same minute: a double-click reuses one Checkout Session.
      { idempotencyKey: `checkout-${userId}-${Math.floor(Date.now() / 60000)}` },
    )
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.')
    return session.url
  }

  // Verifies that the request really came from Stripe. The signature covers
  // the exact raw bytes, which is why the route must pass req.text() unparsed.
  constructEvent(rawBody: string, signature: string): Stripe.Event {
    const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = getServerEnv('stripeWebhook')
    return getStripe(STRIPE_SECRET_KEY).webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  }

  async handleEvent(event: Stripe.Event): Promise<WebhookOutcome> {
    if (event.type !== 'checkout.session.completed') return 'ignored'
    const session = event.data.object
    const userId = session.client_reference_id
    if (!userId || session.payment_status !== 'paid') return 'ignored'

    const admin = createAdminClient()
    const events = new StripeEventsRepository(admin)
    if (!(await events.claim(event.id, event.type))) return 'duplicate'

    try {
      await new ProfilesRepository(admin).markPro(userId)
      return 'processed'
    } catch (error) {
      // Release the claim so Stripe's automatic retry can try again.
      await events.release(event.id)
      throw error
    }
  }
}

export const billingService = new BillingService()
