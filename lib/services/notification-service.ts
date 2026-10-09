import 'server-only'
import { createDefaultDetectionEngine } from '@/lib/detection/engine'
import { getServerEnv } from '@/lib/env'
import { AuthGuardEventsRepository } from '@/lib/repositories/authguard-events-repository'
import { NotificationsRepository } from '@/lib/repositories/notifications-repository'
import { AUTHGUARD_HOME } from '@/lib/routes'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'
import { sendAlertEmail } from './alert-email'

function emailConfig(): { apiKey: string; to: string } | null {
  try {
    const { RESEND_API_KEY, AUTHGUARD_ALERT_EMAIL } = getServerEnv('notifications')
    return RESEND_API_KEY && AUTHGUARD_ALERT_EMAIL ? { apiKey: RESEND_API_KEY, to: AUTHGUARD_ALERT_EMAIL } : null
  } catch {
    return null
  }
}

/**
 * Runs after the Events API has stored an event (inside after(), so the SDK
 * never waits for it). Re-runs detection on the events that can share an
 * alert with the new one, records each new medium/high alert once, and emails
 * it once. The primary key on alert_id makes "once" hold under concurrency.
 */
export async function notifyForEvent(eventId: string, origin: string): Promise<void> {
  const db = createAuthGuardAdminClient()
  const events = new AuthGuardEventsRepository(db)
  const notifications = new NotificationsRepository(db)

  const event = await events.getById(eventId)
  if (!event) return
  const alerts = createDefaultDetectionEngine()
    .run(await events.listRelated(event))
    .filter((alert) => alert.severity !== 'low' && alert.evidence.some((item) => item.eventId === event.id))

  const email = emailConfig()
  for (const alert of alerts) {
    const severity = alert.severity === 'high' ? 'high' : 'medium'
    const created = await notifications.insertIfNew({ alert_id: alert.id, app_id: event.app_id, severity })
    if (!created || !email) continue
    const sent = await sendAlertEmail({ ...email, alert, alertUrl: `${origin}${AUTHGUARD_HOME}/alerts/${alert.id}` })
    if (sent) await notifications.markEmailed(alert.id)
  }
}
