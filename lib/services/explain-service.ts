import 'server-only'
import { z } from 'zod'
import type { LLMClient } from '@/lib/ai/llm-client'
import { FIELD_EXPLAIN_SYSTEM_PROMPT, withFacts } from '@/lib/ai/prompts'

// Allow list: the client can only name a field, never supply a value.
export const EXPLAINABLE_FIELDS = ['sub', 'role', 'aal', 'iat', 'exp', 'session_id'] as const
export type ExplainableField = (typeof EXPLAINABLE_FIELDS)[number]

export const explainFieldRequestSchema = z.object({
  sessionId: z.string().min(1).max(128),
  field: z.enum(EXPLAINABLE_FIELDS),
})

const FIELD_DESCRIPTIONS: Record<ExplainableField, string> = {
  sub: 'The "sub" (subject) claim: the unique user id the session belongs to.',
  role: 'The "role" claim: which database role the session acts as.',
  aal: 'The "aal" (authenticator assurance level) claim: aal1 means a single factor such as a password, aal2 means a second factor was used.',
  iat: 'The "iat" (issued at) claim: when the token was created.',
  exp: 'The "exp" (expiry) claim: after this moment the token is rejected.',
  session_id: 'The "session_id" claim: links tokens to one login session, so activity can be grouped.',
}

export type ClaimSummary = { sub?: string; role?: string; aal?: string; iat?: number; exp?: number; session_id: string }

export class ExplainService {
  constructor(private readonly llm: LLMClient) {}

  // Facts come from stored session_seen payloads. User ids are described, not sent.
  private buildFacts(field: ExplainableField, claims: ClaimSummary) {
    const base = { field, meaning: FIELD_DESCRIPTIONS[field] }
    switch (field) {
      case 'sub':
        return { ...base, value: claims.sub ? 'a user id (hidden here)' : 'unknown' }
      case 'session_id':
        return { ...base, value: 'a session id (hidden here)' }
      case 'role':
        return { ...base, value: claims.role ?? 'unknown' }
      case 'aal':
        return { ...base, value: claims.aal ?? 'unknown' }
      case 'iat':
        return { ...base, value: claims.iat ? new Date(claims.iat * 1000).toISOString() : 'unknown' }
      case 'exp':
        return {
          ...base,
          value: claims.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown',
          lifetimeMinutes: claims.exp && claims.iat ? Math.round((claims.exp - claims.iat) / 60) : 'unknown',
        }
    }
  }

  explain(field: ExplainableField, claims: ClaimSummary): Promise<string> {
    return this.llm.generate({
      system: FIELD_EXPLAIN_SYSTEM_PROMPT,
      prompt: withFacts(this.buildFacts(field, claims), `Explain the "${field}" item.`),
      maxOutputTokens: 300,
    })
  }
}
