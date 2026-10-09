import type { SessionEvent } from '@/lib/types'
import { groupBySession, toEvidence, type Alert, type DetectionRule } from '../types'

// One session should stay on one browser. If the same session_id shows up
// with a different user agent, the session token was probably copied.
export class NewDeviceForSessionRule implements DetectionRule {
  readonly id = 'new-device-for-session'

  evaluate(events: readonly SessionEvent[]): Alert[] {
    const alerts: Alert[] = []
    for (const [sessionId, sessionEvents] of groupBySession(events)) {
      const withAgent = sessionEvents.filter((event) => event.user_agent)
      const agents = new Set(withAgent.map((event) => event.user_agent))
      if (agents.size < 2) continue

      const firstSeen = new Map<string, SessionEvent>()
      for (const event of [...withAgent].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
        if (event.user_agent && !firstSeen.has(event.user_agent)) firstSeen.set(event.user_agent, event)
      }
      alerts.push({
        ruleId: this.id,
        title: 'Same session used from a different device',
        severity: 'high',
        summary: `Session was seen with ${agents.size} different user agents.`,
        sessionId,
        evidence: [...firstSeen.values()].map(toEvidence),
      })
    }
    return alerts
  }
}
