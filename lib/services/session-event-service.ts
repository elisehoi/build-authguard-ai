import 'server-only'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { getServerEnv } from '@/lib/env'
import { getClientIp } from '@/lib/http'
import { SessionEventsRepository } from '@/lib/repositories/session-events-repository'
import { UsersRepository } from '@/lib/repositories/users-repository'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SessionEventType } from '@/lib/types'

type RecordInput = { userId: string | null; sessionId: string | null; eventType: SessionEventType }

export class SessionEventService {
  // SHA-256 with a secret salt: we can still tell whether two events came
  // from the same IP, but nobody can recover the IP from the hash.
  private hashIp(ip: string | null): string | null {
    if (!ip) return null
    let salt: string
    try {
      salt = getServerEnv('security').IP_HASH_SALT
    } catch {
      // Without a salt the hash could be reversed, so store nothing rather
      // than a weak hash, and keep recording the rest of the event.
      return null
    }
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
  }

  // Audit logging must never break the page the user is on, so failures are
  // reported as a warning (without any request data) instead of thrown.
  async record({ userId, sessionId, eventType }: RecordInput): Promise<void> {
    try {
      const requestHeaders = await headers()
      await new SessionEventsRepository(createAdminClient()).insert({
        userId,
        sessionId,
        eventType,
        userAgent: requestHeaders.get('user-agent'),
        ipHash: this.hashIp(getClientIp(requestHeaders)),
      })
    } catch (error) {
      console.warn(`[session-events] Could not record ${eventType}: ${(error as Error).message}`)
    }
  }

  // Failed logins have no session. We resolve the email to a user id on the
  // server so the event lands in that user's history, then discard the email.
  async recordFailedLogin(email: string): Promise<void> {
    let userId: string | null = null
    try {
      userId = await new UsersRepository(createAdminClient()).findIdByEmail(email)
    } catch (error) {
      console.warn(`[session-events] User lookup failed: ${(error as Error).message}`)
    }
    await this.record({ userId, sessionId: null, eventType: 'login_failed' })
  }
}

export const sessionEventService = new SessionEventService()
