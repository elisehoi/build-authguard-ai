import { buildAlert, DAY_MS, groupBy, shortRef, type Alert, type DetectionRule } from '../types'
import { clientFamily } from '../user-agent'
import type { AuthGuardEvent } from '@/lib/types'

export class SessionReuseRule implements DetectionRule {
  readonly id = 'session-reuse'
  readonly description =
    'The same session_id was seen from a different browser or operating system (high), or only from a different hashed IP (low). Browser version updates are ignored.'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    const seen = events.filter((event) => event.event_type === 'session_seen')
    const alerts: Alert[] = []
    for (const [sessionId, group] of groupBy(seen, (event) => event.session_id)) {
      const clients = new Set(group.map((event) => clientFamily(event.user_agent)).filter(Boolean))
      const addresses = new Set(group.map((event) => event.ip_hash).filter(Boolean))
      const otherDevice = clients.size > 1
      // A network change alone is common (Wi-Fi to mobile, VPN), so it is only low.
      if (!otherDevice && addresses.size < 2) continue

      alerts.push(
        buildAlert({
          rule: this,
          ...(otherDevice
            ? {
                title: 'Session token used from another device, possible theft',
                severity: 'high' as const,
                summary: `Session ${shortRef(sessionId)} was seen from ${clients.size} different browsers or operating systems.`,
              }
            : {
                title: 'Session used from a new network',
                severity: 'low' as const,
                summary: `Session ${shortRef(sessionId)} was seen from ${addresses.size} different networks with the same browser.`,
              }),
          subject: `session ${shortRef(sessionId)}`,
          subjectKey: sessionId,
          bucketMs: DAY_MS,
          events: group,
        }),
      )
    }
    return alerts
  }
}
