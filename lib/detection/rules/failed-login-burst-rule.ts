import type { SessionEvent } from '@/lib/types'
import { toEvidence, type Alert, type DetectionRule } from '../types'

// Many wrong passwords in a short window is the signature of password guessing.
export class FailedLoginBurstRule implements DetectionRule {
  readonly id = 'failed-login-burst'

  constructor(
    private readonly threshold = 5,
    private readonly windowMs = 10 * 60 * 1000,
  ) {}

  evaluate(events: readonly SessionEvent[]): Alert | null {
    const failures = events
      .filter((event) => event.event_type === 'login_failed')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

    // Sliding window: find the largest group of failures within windowMs.
    let best: SessionEvent[] = []
    let start = 0
    for (let end = 0; end < failures.length; end++) {
      const endTime = Date.parse(failures[end].created_at)
      while (endTime - Date.parse(failures[start].created_at) > this.windowMs) start++
      if (end - start + 1 > best.length) best = failures.slice(start, end + 1)
    }
    if (best.length < this.threshold) return null

    return {
      ruleId: this.id,
      title: 'Burst of failed logins',
      severity: 'medium',
      summary: `${best.length} failed logins within ${this.windowMs / 60000} minutes.`,
      sessionId: null,
      evidence: best.map(toEvidence),
    }
  }
}
