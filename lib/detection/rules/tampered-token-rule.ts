import { buildAlert, groupBy, HOUR_MS, shortRef, type Alert, type DetectionRule } from '../types'
import type { AuthGuardEvent } from '@/lib/types'

export class TamperedTokenRule implements DetectionRule {
  readonly id = 'tampered-token'
  readonly description = 'An auth cookie was present but failed verification, which can mean a token was edited or forged.'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    const invalid = events.filter((event) => event.event_type === 'token_invalid')
    const alerts: Alert[] = []
    // One alert per client and hour, so a retry loop does not flood the list.
    const groups = groupBy(invalid, (event) => `${event.ip_hash ?? 'unknown'}|${event.user_agent ?? 'unknown'}`)
    for (const [clientKey, group] of groups) {
      const byHour = groupBy(group, (event) => String(Math.floor(Date.parse(event.occurred_at) / HOUR_MS)))
      for (const hourGroup of byHour.values()) {
        const ip = hourGroup[0].ip_hash
        alerts.push(
          buildAlert({
            rule: this,
            title: 'Invalid or tampered token presented',
            severity: 'medium',
            summary: `${hourGroup.length} request${hourGroup.length === 1 ? '' : 's'} carried an auth cookie that failed verification.`,
            subject: ip ? `client ${shortRef(ip)}` : 'unknown client',
            subjectKey: clientKey,
            bucketMs: HOUR_MS,
            events: hourGroup,
          }),
        )
      }
    }
    return alerts
  }
}
