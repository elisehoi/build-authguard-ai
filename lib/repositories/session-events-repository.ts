import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sessionEventSchema, type NewSessionEvent, type SessionEvent } from '@/lib/types'

export class SessionEventsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listRecent(userId: string, limit = 200): Promise<SessionEvent[]> {
    const { data, error } = await this.db
      .from('session_events')
      .select('id, user_id, session_id, event_type, user_agent, ip_hash, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`Could not load session events: ${error.message}`)
    return z.array(sessionEventSchema).parse(data)
  }

  // Requires the service role client. Users get no INSERT policy so they
  // cannot forge or erase their own audit trail.
  async insert(event: NewSessionEvent): Promise<void> {
    const { error } = await this.db.from('session_events').insert({
      user_id: event.userId,
      session_id: event.sessionId,
      event_type: event.eventType,
      user_agent: event.userAgent?.slice(0, 400) ?? null,
      ip_hash: event.ipHash,
    })
    if (error) throw new Error(`Could not record session event: ${error.message}`)
  }
}
