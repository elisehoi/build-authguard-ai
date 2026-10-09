import type { SessionEvent } from '@/lib/types'

export type AlertSeverity = 'low' | 'medium' | 'high'

export type AlertEvidence = { eventId: number; eventType: SessionEvent['event_type']; createdAt: string }

export type Alert = {
  ruleId: string
  title: string
  severity: AlertSeverity
  summary: string
  sessionId: string | null
  evidence: AlertEvidence[]
}

// Strategy interface: every rule is an independent, pure function of events.
// Rules may return several alerts (e.g. one per session) or none.
export interface DetectionRule {
  readonly id: string
  evaluate(events: readonly SessionEvent[]): Alert | Alert[] | null
}

export function toEvidence(event: SessionEvent): AlertEvidence {
  return { eventId: event.id, eventType: event.event_type, createdAt: event.created_at }
}

export function groupBySession(events: readonly SessionEvent[]): Map<string, SessionEvent[]> {
  const groups = new Map<string, SessionEvent[]>()
  for (const event of events) {
    if (!event.session_id) continue
    const list = groups.get(event.session_id) ?? []
    list.push(event)
    groups.set(event.session_id, list)
  }
  return groups
}
