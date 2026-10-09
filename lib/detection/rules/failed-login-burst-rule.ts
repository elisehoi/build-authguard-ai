import { buildAlert, groupBy, HOUR_MS, shortRef, type Alert, type DetectionRule } from '../types'
import type { AuthGuardEvent } from '@/lib/types'

const THRESHOLD = 5
const WINDOW_MS = 10 * 60 * 1000

const time = (event: AuthGuardEvent) => Date.parse(event.occurred_at)

export class FailedLoginBurstRule implements DetectionRule {
  readonly id = 'failed-login-burst'
  readonly description = `${THRESHOLD} or more failed logins for the same email hash within 10 minutes, which can mean password guessing. Severity is high when a successful login follows.`

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    const successes = events.filter((event) => event.event_type === 'login_success')
    const failures = events.filter((event) => event.event_type === 'login_failed')
    const alerts: Alert[] = []

    for (const [emailHash, group] of groupBy(failures, (event) => event.email_hash)) {
      const ordered = [...group].sort((a, b) => time(a) - time(b))
      let start = 0
      while (start < ordered.length) {
        let end = start
        while (end + 1 < ordered.length && time(ordered[end + 1]) - time(ordered[start]) <= WINDOW_MS) end++
        if (end - start + 1 < THRESHOLD) {
          start++
          continue
        }

        const burst = ordered.slice(start, end + 1)
        const burstEnd = time(burst[burst.length - 1])
        const followUp = successes.find(
          (event) => event.email_hash === emailHash && time(event) >= time(burst[0]) && time(event) <= burstEnd + WINDOW_MS,
        )
        alerts.push(
          buildAlert({
            rule: this,
            title: 'Possible password guessing',
            severity: followUp ? 'high' : 'medium',
            summary: followUp
              ? `${burst.length} failed logins for email hash ${shortRef(emailHash)} were followed by a successful login, so a guess may have worked.`
              : `${burst.length} failed logins for email hash ${shortRef(emailHash)} within 10 minutes.`,
            subject: `email hash ${shortRef(emailHash)}`,
            subjectKey: emailHash,
            bucketMs: HOUR_MS,
            events: followUp ? [...burst, followUp] : burst,
          }),
        )
        start = end + 1
      }
    }
    return alerts
  }
}
