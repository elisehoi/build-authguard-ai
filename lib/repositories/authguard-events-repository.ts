import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { authGuardEventSchema, type AuthGuardEvent, type EventType } from '@/lib/types'

export type NewAuthGuardEvent = {
  app_id: string
  event_type: EventType
  session_id?: string
  user_ref?: string
  email_hash?: string
  user_agent?: string
  ip_hash?: string
  payload: Record<string, unknown>
  occurred_at: string
}

const WINDOW_DAYS = 7
const MAX_EVENTS = 2000
const DEDUPE_WINDOW_MS = 5 * 60 * 1000

// Must be given the service-role client: the table has RLS enabled and no policies.
export class AuthGuardEventsRepository {
  constructor(private readonly db: SupabaseClient) {}

  // Oldest first, because detection rules walk events in time order.
  async listRecent(): Promise<AuthGuardEvent[]> {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await this.db
      .from('authguard_events')
      .select('*')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(MAX_EVENTS)
    if (error) throw new Error(`Could not load events: ${error.message}`)
    return z.array(authGuardEventSchema).parse(data).reverse()
  }

  async listForSession(sessionId: string): Promise<AuthGuardEvent[]> {
    const { data, error } = await this.db
      .from('authguard_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('occurred_at', { ascending: true })
      .limit(500)
    if (error) throw new Error(`Could not load session events: ${error.message}`)
    return z.array(authGuardEventSchema).parse(data)
  }

  async hasRecentSessionSeen(event: NewAuthGuardEvent): Promise<boolean> {
    if (!event.session_id) return false
    const since = new Date(Date.parse(event.occurred_at) - DEDUPE_WINDOW_MS).toISOString()
    let query = this.db
      .from('authguard_events')
      .select('id')
      .eq('app_id', event.app_id)
      .eq('event_type', 'session_seen')
      .eq('session_id', event.session_id)
      .gte('occurred_at', since)
      .limit(1)
    query = event.user_agent ? query.eq('user_agent', event.user_agent) : query.is('user_agent', null)
    query = event.ip_hash ? query.eq('ip_hash', event.ip_hash) : query.is('ip_hash', null)
    const { data, error } = await query
    if (error) throw new Error(`Could not check duplicates: ${error.message}`)
    return (data?.length ?? 0) > 0
  }

  async insert(event: NewAuthGuardEvent): Promise<string> {
    const { data, error } = await this.db.from('authguard_events').insert(event).select('id').single()
    if (error) throw new Error(`Could not store event: ${error.message}`)
    return z.object({ id: z.string() }).parse(data).id
  }
}
