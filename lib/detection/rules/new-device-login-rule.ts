import { buildAlert, DAY_MS, groupBy, shortRef, type Alert, type DetectionRule } from '../types'
import type { AuthGuardEvent } from '@/lib/types'

export class NewDeviceLoginRule implements DetectionRule {
  readonly id = 'new-device-login'
  readonly description = 'A successful login came from a user agent never seen before for that user. The first activity of a user is not flagged.'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    const alerts: Alert[] = []
    for (const [userRef, group] of groupBy(events, (event) => event.user_ref)) {
      const ordered = [...group].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
      const knownAgents = new Set<string>()
      const flaggedAgents = new Set<string>()
      for (const [index, event] of ordered.entries()) {
        const agent = event.user_agent
        if (event.event_type === 'login_success' && agent && index > 0 && !knownAgents.has(agent) && !flaggedAgents.has(agent)) {
          flaggedAgents.add(agent)
          alerts.push(
            buildAlert({
              rule: this,
              title: 'Login from a new device',
              severity: 'low',
              summary: `User ref ${shortRef(userRef)} logged in from a user agent not seen before for this user.`,
              subject: `user ref ${shortRef(userRef)}`,
              subjectKey: `${userRef}|${agent}`,
              bucketMs: DAY_MS,
              events: [event],
            }),
          )
        }
        if (agent) knownAgents.add(agent)
      }
    }
    return alerts
  }
}
