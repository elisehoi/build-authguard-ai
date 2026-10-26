import 'server-only'
import { z } from 'zod'
import type { LLMClient } from '@/lib/ai/llm-client'
import { ALERT_EXPLAIN_SYSTEM_PROMPT, SECURITY_REPORT_SYSTEM_PROMPT, withFacts } from '@/lib/ai/prompts'
import type { Alert } from '@/lib/detection/types'
import { clientFamily } from '@/lib/detection/user-agent'

export const LEARN_MORE_LINKS = [
  'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
  'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
  'https://haveibeenpwned.com/Passwords',
  'https://supabase.com/docs/guides/auth',
] as const

export const securityReportSchema = z.object({
  summary: z.string().describe('Two sentences at most.'),
  whatHappened: z
    .array(z.object({ statement: z.string(), eventIds: z.array(z.string()).describe('Only event ids from the evidence.') }))
    .max(6),
  likelyCause: z.object({
    statement: z.string().describe('Or "unknown" when the evidence does not show a cause.'),
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  impact: z.string().describe('Impact on the account, or "unknown".'),
  fixes: z
    .array(z.object({ action: z.string(), learnMoreUrl: z.enum(LEARN_MORE_LINKS) }))
    .min(1)
    .max(5),
})
export type SecurityReport = z.infer<typeof securityReportSchema>

// Only the alert, its evidence and the rule description go to the model. The
// raw User-Agent is visitor-controlled, so it is reduced to browser and OS family.
function alertFacts(alert: Alert) {
  return {
    rule: { id: alert.ruleId, description: alert.ruleDescription, severity: alert.severity },
    alert: { title: alert.title, summary: alert.summary, subject: alert.subject, lastSeen: alert.occurredAt },
    evidence: alert.evidence.map(({ userAgent, ...item }) => ({ ...item, client: clientFamily(userAgent) })),
  }
}

export class AlertAiService {
  constructor(private readonly llm: LLMClient) {}

  explain(alert: Alert): Promise<string> {
    return this.llm.generate({
      system: ALERT_EXPLAIN_SYSTEM_PROMPT,
      prompt: withFacts(alertFacts(alert), 'Explain this alert in plain language.'),
      maxOutputTokens: 400,
    })
  }

  async generateReport(alert: Alert): Promise<SecurityReport> {
    const report = await this.llm.generateStructured({
      system: SECURITY_REPORT_SYSTEM_PROMPT,
      prompt: withFacts(alertFacts(alert), 'Write the security report for this alert.'),
      schema: securityReportSchema,
    })

    // Hallucination guard: drop any cited event id that is not in the evidence.
    const knownIds = new Set(alert.evidence.map((item) => item.eventId))
    const whatHappened = report.whatHappened.map((item) => ({ ...item, eventIds: item.eventIds.filter((id) => knownIds.has(id)) }))
    const hadUnknownCitation = report.whatHappened.some((item, index) => item.eventIds.length !== whatHappened[index].eventIds.length)
    return {
      ...report,
      whatHappened,
      likelyCause: hadUnknownCitation ? { ...report.likelyCause, confidence: 'low' } : report.likelyCause,
    }
  }
}
