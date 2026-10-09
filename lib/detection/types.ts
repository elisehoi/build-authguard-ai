import { createHash } from 'node:crypto'
import type { AuthGuardEvent, EventType } from '@/lib/types'

export type AlertSeverity = 'low' | 'medium' | 'high'

export type AlertEvidence = {
  eventId: string
  eventType: EventType
  occurredAt: string
  userAgent: string | null
  ipHashPrefix: string | null
  details: Record<string, unknown>
}

export type Alert = {
  id: string
  ruleId: string
  ruleDescription: string
  title: string
  severity: AlertSeverity
  summary: string
  /** Human-readable affected party, e.g. "session 9f3c1a2b" or "user ref 3fa9c1d0". */
  subject: string
  sessionId: string | null
  userRef: string | null
  occurredAt: string
  evidence: AlertEvidence[]
}

// Strategy interface: every rule is an independent, pure function of events.
export interface DetectionRule {
  readonly id: string
  readonly description: string
  evaluate(events: readonly AuthGuardEvent[]): Alert[]
}

export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS

export const shortRef = (value: string) => value.slice(0, 8)

export function toEvidence(event: AuthGuardEvent): AlertEvidence {
  return {
    eventId: event.id,
    eventType: event.event_type,
    occurredAt: event.occurred_at,
    userAgent: event.user_agent,
    ipHashPrefix: event.ip_hash ? event.ip_hash.slice(0, 8) : null,
    details: event.payload,
  }
}

type AlertInput = {
  rule: Pick<DetectionRule, 'id' | 'description'>
  title: string
  severity: AlertSeverity
  summary: string
  subject: string
  /** Stable key for who is affected, so the same situation always yields the same id. */
  subjectKey: string
  /** Time bucket for the id. Omit for one alert per subject, whenever it happens. */
  bucketMs?: number
  events: readonly AuthGuardEvent[]
}

// The id is rule + subject + time bucket of the first evidence event, so the
// same situation keeps its id across page loads without storing alerts.
export function buildAlert(input: AlertInput): Alert {
  const sorted = [...input.events].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const bucket = input.bucketMs ? Math.floor(Date.parse(first.occurred_at) / input.bucketMs) : 'once'
  const id = createHash('sha256').update(`${input.rule.id}|${input.subjectKey}|${bucket}`).digest('hex').slice(0, 16)
  return {
    id,
    ruleId: input.rule.id,
    ruleDescription: input.rule.description,
    title: input.title,
    severity: input.severity,
    summary: input.summary,
    subject: input.subject,
    sessionId: sorted.find((event) => event.session_id)?.session_id ?? null,
    userRef: sorted.find((event) => event.user_ref)?.user_ref ?? null,
    occurredAt: last.occurred_at,
    evidence: sorted.slice(0, 25).map(toEvidence),
  }
}

export function groupBy<T>(items: readonly T[], keyOf: (item: T) => string | null): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (key === null) continue
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  return groups
}
