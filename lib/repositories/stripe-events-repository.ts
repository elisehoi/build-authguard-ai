import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export class StripeEventsRepository {
  constructor(private readonly db: SupabaseClient) {}

  // Stripe retries webhooks, so the same event can arrive several times. The
  // primary key on the event id turns "insert" into an atomic claim: only the
  // first delivery succeeds, later ones get a unique violation (23505).
  async claim(eventId: string, type: string): Promise<boolean> {
    const { error } = await this.db.from('processed_stripe_events').insert({ id: eventId, type })
    if (!error) return true
    if (error.code === '23505') return false
    throw new Error(`Could not record Stripe event: ${error.message}`)
  }

  async release(eventId: string): Promise<void> {
    await this.db.from('processed_stripe_events').delete().eq('id', eventId)
  }
}
