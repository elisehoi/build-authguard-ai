import { buildAlert, DAY_MS, groupBy, shortRef, type Alert, type DetectionRule } from '../types'
import type { AuthGuardEvent } from '@/lib/types'

// Password checks have no session, so they are grouped by account (user ref,
// or email hash when the account is not known) and by day.
function evaluatePasswordChecks(
  rule: DetectionRule,
  events: readonly AuthGuardEvent[],
  matches: (event: AuthGuardEvent) => boolean,
  describe: (subject: string, count: number) => Pick<Alert, 'title' | 'summary' | 'severity'>,
): Alert[] {
  const flagged = events.filter((event) => event.event_type === 'password_check' && matches(event))
  const alerts: Alert[] = []
  for (const [key, group] of groupBy(flagged, (event) => event.user_ref ?? event.email_hash)) {
    const subject = group[0].user_ref ? `user ref ${shortRef(key)}` : `email hash ${shortRef(key)}`
    alerts.push(buildAlert({ rule, ...describe(subject, group.length), subject, subjectKey: key, bucketMs: DAY_MS, events: group }))
  }
  return alerts
}

export class BreachedPasswordRule implements DetectionRule {
  readonly id = 'breached-password'
  readonly description = 'A password used at sign-up or login appears in a public data breach (checked with k-anonymity, the password never left the server).'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    return evaluatePasswordChecks(
      this,
      events,
      (event) => event.payload.breached === true,
      (subject, count) => ({
        severity: 'high',
        title: 'Password found in a known data breach',
        summary: `${subject} used a password that appears in public breach data (${count} check${count === 1 ? '' : 's'}).`,
      }),
    )
  }
}

export class WeakPasswordRule implements DetectionRule {
  readonly id = 'weak-password'
  readonly description = 'A password used at sign-up or login scored 0 or 1 out of 4 on a guessability estimate.'

  evaluate(events: readonly AuthGuardEvent[]): Alert[] {
    return evaluatePasswordChecks(
      this,
      events,
      (event) => typeof event.payload.strength === 'number' && event.payload.strength <= 1,
      (subject, count) => ({
        severity: 'medium',
        title: 'Weak password in use',
        summary: `${subject} used a password that is easy to guess (${count} check${count === 1 ? '' : 's'}).`,
      }),
    )
  }
}
