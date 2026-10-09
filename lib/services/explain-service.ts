import 'server-only'
import { z } from 'zod'
import type { LLMClient } from '@/lib/ai/llm-client'
import { EXPLAIN_SYSTEM_PROMPTS, withFacts } from '@/lib/ai/prompts'
import { getAuthCookieName } from '@/lib/supabase/cookie-name'
import type { TokenClaims } from './token-service'

// Allow list: the client can only name a field, never supply a value.
export const EXPLAINABLE_FIELDS = ['sub', 'email', 'role', 'aud', 'iat', 'exp', 'session_id', 'storage'] as const
export type ExplainableField = (typeof EXPLAINABLE_FIELDS)[number]

export const explainRequestSchema = z.object({
  field: z.enum(EXPLAINABLE_FIELDS),
  level: z.enum(['beginner', 'technical']).default('beginner'),
})
export type ExplainLevel = z.infer<typeof explainRequestSchema>['level']

const FIELD_DESCRIPTIONS: Record<ExplainableField, string> = {
  sub: 'The "sub" (subject) claim: the unique user id the token belongs to.',
  email: 'The "email" claim: which email address the account uses.',
  role: 'The "role" claim: which Postgres role Supabase uses for this request.',
  aud: 'The "aud" (audience) claim: who the token is intended for.',
  iat: 'The "iat" (issued at) claim: when the token was created.',
  exp: 'The "exp" (expiry) claim: after this moment the token is rejected.',
  session_id: 'The "session_id" claim: links this token to one login session.',
  storage: 'Where the session is stored in the browser.',
}

export class ExplainService {
  constructor(private readonly llm: LLMClient) {}

  // Facts come from the server's own verified claims. Email is described,
  // never sent, so no personal data reaches the model.
  private buildFacts(field: ExplainableField, claims: TokenClaims) {
    const now = Math.floor(Date.now() / 1000)
    const base = { field, meaning: FIELD_DESCRIPTIONS[field] }
    switch (field) {
      case 'sub':
        return { ...base, value: 'a UUID (hidden here)', usedFor: 'Row Level Security compares it with notes.user_id via auth.uid().' }
      case 'email':
        return { ...base, value: claims.email ? 'present (hidden here)' : 'absent', usedFor: 'display and account recovery, not for authorization' }
      case 'role':
        return { ...base, value: claims.role ?? 'unknown', usedFor: 'Supabase switches to this Postgres role; RLS policies then apply.' }
      case 'aud':
        return { ...base, value: claims.aud ?? 'unknown' }
      case 'iat':
        return { ...base, value: claims.iat ? new Date(claims.iat * 1000).toISOString() : 'unknown' }
      case 'exp':
        return {
          ...base,
          value: claims.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown',
          secondsRemaining: claims.exp ? claims.exp - now : 'unknown',
          lifetimeMinutes: claims.exp && claims.iat ? Math.round((claims.exp - claims.iat) / 60) : 'unknown',
        }
      case 'session_id':
        return { ...base, value: claims.session_id ? 'a UUID (hidden here)' : 'absent', usedFor: 'sign-out revokes the session, and detection rules group events by it' }
      case 'storage':
        return { ...base, value: `cookie named ${getAuthCookieName()}, possibly chunked into .0/.1`, setBy: '@supabase/ssr', httpOnly: false }
    }
  }

  explain(field: ExplainableField, level: ExplainLevel, claims: TokenClaims): Promise<string> {
    return this.llm.generate({
      system: EXPLAIN_SYSTEM_PROMPTS[level],
      prompt: withFacts(this.buildFacts(field, claims), `Explain the "${field}" item.`),
      maxOutputTokens: 300,
    })
  }
}
