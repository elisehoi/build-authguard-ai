import 'server-only'
import { createDefaultDetectionEngine } from '@/lib/detection/engine'
import { getServerEnv } from '@/lib/env'
import { AuthGuardEventsRepository } from '@/lib/repositories/authguard-events-repository'
import { NotificationsRepository } from '@/lib/repositories/notifications-repository'
import { AUTHGUARD_HOME } from '@/lib/routes'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'
import { sendAlertEmail } from './alert-email'

function emailConfig(): { apiKey: string; to: string; publicUrl?: string } | null {
  try {
    const { RESEND_API_KEY, AUTHGUARD_ALERT_EMAIL, AUTHGUARD_PUBLIC_URL } = getServerEnv('notifications')
    return RESEND_API_KEY && AUTHGUARD_ALERT_EMAIL ? { apiKey: RESEND_API_KEY, to: AUTHGUARD_ALERT_EMAIL, publicUrl: AUTHGUARD_PUBLIC_URL } : null
  } catch {
    return null
  }
}

/**
 * Runs after the Events API has stored an event (inside after(), so the SDK
 * never waits for it). Re-runs detection on the events that can share an
 * alert with the new one, records each new medium/high alert once, and emails
 * it once. An alert that escalates from medium to high is updated and emailed
 * once more. The primary key and conditional updates make "once" hold under
 * concurrency. `origin` is only the fallback when AUTHGUARD_PUBLIC_URL is unset.
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
  const baseUrl = (email?.publicUrl ?? origin).replace(/\/+$/, '')
  for (const alert of alerts) {
    const severity = alert.severity === 'high' ? 'high' : 'medium'
    const created = await notifications.insertIfNew({ alert_id: alert.id, app_id: event.app_id, severity })
    const escalated = !created && severity === 'high' && (await notifications.escalateToHigh(alert.id))
    if ((!created && !escalated) || !email) continue
    const sent = await sendAlertEmail({ apiKey: email.apiKey, to: email.to, alert, escalated, alertUrl: `${baseUrl}${AUTHGUARD_HOME}/alerts/${alert.id}` })
    if (sent) await notifications.markEmailed(alert.id)
  }
}
