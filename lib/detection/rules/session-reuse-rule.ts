import { buildAlert, DAY_MS, groupBy, shortRef, type Alert, type DetectionRule } from '../types'
import type { AuthGuardEvent } from '@/lib/types'

export class SessionReuseRule implements DetectionRule {
  readonly id = 'session-reuse'
  readonly description =
    'The same session_id was seen with a different user agent or hashed IP, which can mean the session token was copied to another device.'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    const seen = events.filter((event) => event.event_type === 'session_seen')
    const alerts: Alert[] = []
    for (const [sessionId, group] of groupBy(seen, (event) => event.session_id)) {
      const agents = new Set(group.map((event) => event.user_agent).filter(Boolean))
      const addresses = new Set(group.map((event) => event.ip_hash).filter(Boolean))
      if (agents.size < 2 && addresses.size < 2) continue

      const changed = [agents.size > 1 && 'user agent', addresses.size > 1 && 'network address'].filter(Boolean).join(' and ')
      alerts.push(
        buildAlert({
          rule: this,
          title: 'Session token used from another device, possible theft',
          severity: 'high',
          summary: `Session ${shortRef(sessionId)} was seen with ${Math.max(agents.size, addresses.size)} different clients (the ${changed} changed).`,
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
