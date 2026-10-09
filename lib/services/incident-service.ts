import 'server-only'
import { z } from 'zod'
import type { LLMClient } from '@/lib/ai/llm-client'
import { INCIDENT_SYSTEM_PROMPT, withFacts } from '@/lib/ai/prompts'
import { createDefaultDetectionEngine } from '@/lib/detection/engine'
import type { Alert } from '@/lib/detection/types'
import { SessionEventsRepository } from '@/lib/repositories/session-events-repository'
import type { SupabaseClient } from '@supabase/supabase-js'

export const incidentReportSchema = z.object({
  likelyCause: z.string().describe('One or two sentences, or "unknown" if the evidence is insufficient.'),
  evidence: z
    .array(z.object({ eventId: z.number().int(), why: z.string() }))
    .describe('Only event ids that appear in the alerts data.'),
  confidence: z.enum(['low', 'medium', 'high']),
  fixes: z.array(z.string()).max(6),
})
export type IncidentReport = z.infer<typeof incidentReportSchema>

export class IncidentService {
  constructor(private readonly db: SupabaseClient) {}

  // Detection is pure, deterministic code. The AI never decides what counts
  // as an alert; it only writes up what the rules already found.
  async detect(userId: string): Promise<Alert[]> {
    const events = await new SessionEventsRepository(this.db).listRecent(userId)
    return createDefaultDetectionEngine().run(events)
  }

  async generateReport(alerts: Alert[], llm: LLMClient): Promise<IncidentReport> {
    if (alerts.length === 0) {
      return { likelyCause: 'unknown', evidence: [], confidence: 'low', fixes: ['No alerts were found, so there is nothing to investigate.'] }
    }

    // User agents and hashes are left out: rule summaries are enough context.
    const facts = alerts.map(({ ruleId, title, severity, summary, evidence }) => ({ ruleId, title, severity, summary, evidence }))
    const report = await llm.generateStructured({
      system: INCIDENT_SYSTEM_PROMPT,
      prompt: withFacts({ alerts: facts }),
      schema: incidentReportSchema,
    })

    // Hallucination guard: drop any cited event id the rules did not produce.
    const knownIds = new Set(alerts.flatMap((alert) => alert.evidence.map((item) => item.eventId)))
    const evidence = report.evidence.filter((item) => knownIds.has(item.eventId))
    const dropped = report.evidence.length - evidence.length
    return {
      ...report,
      evidence,
      confidence: dropped > 0 ? 'low' : report.confidence,
    }
  }
}
