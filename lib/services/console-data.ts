import 'server-only'
import { cache } from 'react'
import { createDefaultDetectionEngine } from '@/lib/detection/engine'
import { clientFamily } from '@/lib/detection/user-agent'
import type { Alert } from '@/lib/detection/types'
import { AuthGuardEventsRepository } from '@/lib/repositories/authguard-events-repository'
import { NotificationsRepository } from '@/lib/repositories/notifications-repository'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'
import type { AuthGuardEvent } from '@/lib/types'
import { demoAppId, getConsoleAccess } from './console-access'

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
  return new AuthGuardEventsRepository(createAuthGuardAdminClient()).listForSession(sessionId, demoAppId())
}

export type UnreadNotification = { alertId: string; severity: 'medium' | 'high'; title: string; createdAt: string }

// Unread alert notifications for the header bell and the "New" badges.
// Titles come from the current snapshot; alerts older than 7 days keep a generic one.
export const loadUnreadNotifications = cache(async (): Promise<{ count: number; items: UnreadNotification[] }> => {
  await assertConsoleAdmin()
  const repository = new NotificationsRepository(createAuthGuardAdminClient())
  const [count, rows, { alerts }] = await Promise.all([repository.countUnread(), repository.listUnread(), loadSnapshot()])
  const titles = new Map(alerts.map((alert) => [alert.id, alert.title]))
  return {
    count,
    items: rows.map((row) => ({
      alertId: row.alert_id,
      severity: row.severity,
      title: titles.get(row.alert_id) ?? `Alert ${row.alert_id.slice(0, 8)}`,
      createdAt: row.created_at,
    })),
  }
})

export async function markAllNotificationsRead(): Promise<void> {
  await assertConsoleAdmin()
  await new NotificationsRepository(createAuthGuardAdminClient()).markAllRead()
}

export async function markNotificationRead(alertId: string): Promise<void> {
  await assertConsoleAdmin()
  await new NotificationsRepository(createAuthGuardAdminClient()).markRead(alertId)
}

// What the assistant is allowed to see: alerts and events, with hashes cut to a
// prefix. The raw User-Agent is visitor-controlled text, so only its browser and
// OS family ("Chrome|Windows") reaches the model, never the string itself.
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
      client: clientFamily(event.user_agent),
      ipHashPrefix: event.ip_hash?.slice(0, 8) ?? null,
      details: event.payload,
    })),
  }
}
