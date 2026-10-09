import type { AuthGuardEvent } from '@/lib/types'
import type { Alert, AlertSeverity, DetectionRule } from './types'
import { FailedLoginBurstRule } from './rules/failed-login-burst-rule'
import { NewDeviceLoginRule } from './rules/new-device-login-rule'
import { BreachedPasswordRule, WeakPasswordRule } from './rules/password-rules'
import { SessionReuseRule } from './rules/session-reuse-rule'
import { TamperedTokenRule } from './rules/tampered-token-rule'

const SEVERITY_ORDER: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 }

// Open/closed: the engine knows only the DetectionRule interface. Adding a
// rule means writing a new class and registering it, never editing run().
export class DetectionEngine {
  constructor(private readonly rules: readonly DetectionRule[]) {}

  run(events: readonly AuthGuardEvent[]): Alert[] {
    const byId = new Map<string, Alert>()
    for (const rule of this.rules) {
      for (const alert of rule.evaluate(events)) byId.set(alert.id, alert)
    }
    return [...byId.values()].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    )
  }
}

export function createDefaultDetectionEngine(): DetectionEngine {
  return new DetectionEngine([
    new SessionReuseRule(),
    new FailedLoginBurstRule(),
    new BreachedPasswordRule(),
    new WeakPasswordRule(),
    new TamperedTokenRule(),
    new NewDeviceLoginRule(),
  ])
}
