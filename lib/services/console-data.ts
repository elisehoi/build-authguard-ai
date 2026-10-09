import 'server-only'
import { cache } from 'react'
import { createDefaultDetectionEngine } from '@/lib/detection/engine'
import type { Alert } from '@/lib/detection/types'
import { AuthGuardEventsRepository } from '@/lib/repositories/authguard-events-repository'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'
import type { AuthGuardEvent } from '@/lib/types'
import { getConsoleAccess } from './console-access'

export type ConsoleSnapshot = { events: AuthGuardEvent[]; alerts: Alert[] }

// These loaders read the Werkstatt demo app's events with the service-role
// client, so they re-check ownership themselves instead of trusting each caller.
async function assertConsoleAdmin(): Promise<void> {
  const access = await getConsoleAccess()
  if (access.status !== 'ok' || !access.ownsDemoApp) throw new Error('AuthGuard: this account has no connected apps')
}

// Alerts are computed on read from the stored events; nothing about them is persisted.
export const loadSnapshot = cache(async (): Promise<ConsoleSnapshot> => {
  await assertConsoleAdmin()
  const events = await new AuthGuardEventsRepository(createAuthGuardAdminClient()).listRecent()
  return { events, alerts: createDefaultDetectionEngine().run(events) }
})

export async function loadSession(sessionId: string): Promise<AuthGuardEvent[]> {
  await assertConsoleAdmin()
  return new AuthGuardEventsRepository(createAuthGuardAdminClient()).listForSession(sessionId)
}

// What the assistant is allowed to see: alerts and events, with hashes cut to a prefix.
export function buildAssistantFacts({ events, alerts }: ConsoleSnapshot) {
  return {
    alerts: alerts.slice(0, 25).map((alert) => ({
      id: alert.id,
      rule: alert.ruleId,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      subject: alert.subject,
      occurredAt: alert.occurredAt,
      evidenceEventIds: alert.evidence.map((item) => item.eventId),
    })),
    recentEvents: events.slice(-60).map((event) => ({
      id: event.id,
      type: event.event_type,
      occurredAt: event.occurred_at,
      sessionId: event.session_id,
      userRef: event.user_ref?.slice(0, 8) ?? null,
      emailHashPrefix: event.email_hash?.slice(0, 8) ?? null,
      userAgent: event.user_agent,
      ipHashPrefix: event.ip_hash?.slice(0, 8) ?? null,
      details: event.payload,
    })),
  }
}
