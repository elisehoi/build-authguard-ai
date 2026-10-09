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

  // Every recent event that can share an alert with `event`: same session,
  // user ref or email hash, and (for invalid tokens) same hashed client.
  // Separate queries instead of one .or() filter, so values are never parsed
  // as filter syntax.
  async listRelated(event: AuthGuardEvent): Promise<AuthGuardEvent[]> {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const base = () => this.db.from('authguard_events').select('*').eq('app_id', event.app_id).gte('occurred_at', since).limit(MAX_EVENTS)
    const queries = [
      event.session_id ? base().eq('session_id', event.session_id) : null,
      event.user_ref ? base().eq('user_ref', event.user_ref) : null,
      event.email_hash ? base().eq('email_hash', event.email_hash) : null,
      event.event_type === 'token_invalid'
        ? event.ip_hash
          ? base().eq('event_type', 'token_invalid').eq('ip_hash', event.ip_hash)
          : base().eq('event_type', 'token_invalid').is('ip_hash', null)
        : null,
    ].filter((query) => query !== null)

    const byId = new Map<string, AuthGuardEvent>([[event.id, event]])
    for (const { data, error } of await Promise.all(queries)) {
      if (error) throw new Error(`Could not load related events: ${error.message}`)
      for (const row of z.array(authGuardEventSchema).parse(data)) byId.set(row.id, row)
    }
    return [...byId.values()].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
  }

  async getById(id: string): Promise<AuthGuardEvent | null> {
    const { data, error } = await this.db.from('authguard_events').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(`Could not load event: ${error.message}`)
    return data ? authGuardEventSchema.parse(data) : null
  }

  async lastEventAt(appId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('authguard_events')
      .select('occurred_at')
      .eq('app_id', appId)
      .order('occurred_at', { ascending: false })
      .limit(1)
    if (error) throw new Error(`Could not read the last event: ${error.message}`)
    return data?.[0]?.occurred_at ?? null
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
