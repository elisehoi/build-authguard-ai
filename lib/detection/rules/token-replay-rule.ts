import type { SessionEvent } from '@/lib/types'
import { groupBySession, toEvidence, type Alert, type DetectionRule } from '../types'

export class TokenReplayRule implements DetectionRule {
  readonly id = 'token-replay'

  evaluate(events: readonly SessionEvent[]): Alert[] {
    const replays = events.filter((event) => event.event_type === 'token_replay')
    return [...groupBySession(replays)].map(([sessionId, sessionReplays]) => ({
      ruleId: this.id,
      title: 'Session token was replayed',
      severity: 'high',
      summary: `The access token for this session was used ${sessionReplays.length} time(s) without a login.`,
      sessionId,
      evidence: sessionReplays.map(toEvidence),
    }))
  }
}
