import type { SessionEvent } from '@/lib/types'
import type { Alert, DetectionRule } from './types'
import { FailedLoginBurstRule } from './rules/failed-login-burst-rule'
import { NewDeviceForSessionRule } from './rules/new-device-for-session-rule'
import { TokenReplayRule } from './rules/token-replay-rule'

// Open/closed: the engine knows only the DetectionRule interface. Adding a
// rule means writing a new class and registering it, never editing run().
export class DetectionEngine {
  constructor(private readonly rules: readonly DetectionRule[]) {}

  run(events: readonly SessionEvent[]): Alert[] {
    return this.rules.flatMap((rule) => {
      const result = rule.evaluate(events)
      if (!result) return []
      return Array.isArray(result) ? result : [result]
    })
  }
}

export function createDefaultDetectionEngine(): DetectionEngine {
  return new DetectionEngine([new NewDeviceForSessionRule(), new TokenReplayRule(), new FailedLoginBurstRule()])
}
