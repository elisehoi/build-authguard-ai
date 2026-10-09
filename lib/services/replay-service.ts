import 'server-only'
import { z } from 'zod'
import type { LLMClient } from '@/lib/ai/llm-client'
import { DEMO_SYSTEM_PROMPT, withFacts } from '@/lib/ai/prompts'
import { NotesRepository } from '@/lib/repositories/notes-repository'
import { createTokenClient } from '@/lib/supabase/token-client'
import { tokenService } from './token-service'

// 12k covers a chunked cookie; anything larger is not a Supabase session.
export const replayRequestSchema = z.object({ token: z.string().trim().min(20).max(12000) })

export type ReplayResult =
  | {
      ok: true
      notesRead: { id: string; content: string; created_at: string }[]
      tokenOwnerMatchesYou: boolean
      expiresAt: string | null
      secondsRemaining: number | null
    }
  | { ok: false; reason: string }

export type TamperResult = {
  originalRole: string
  forgedRole: string
  accepted: boolean
  serverMessage: string
}

export type ReplayAudit = { victimUserId: string; sessionId: string | null }

export class ReplayService {
  // The token is used once, in memory, and never stored or logged. Only the
  // non-secret owner id and session_id are returned, for the audit event.
  async replay(input: string, currentUserId: string): Promise<{ result: ReplayResult; audit: ReplayAudit | null }> {
    let token: string
    try {
      token = tokenService.extractAccessToken(input)
    } catch (error) {
      return { result: { ok: false, reason: (error as Error).message }, audit: null }
    }

    let claims
    try {
      claims = tokenService.decode(token)
    } catch (error) {
      return { result: { ok: false, reason: (error as Error).message }, audit: null }
    }

    try {
      const notes = await new NotesRepository(createTokenClient(token)).list()
      const now = Math.floor(Date.now() / 1000)
      return {
        result: {
          ok: true,
          notesRead: notes.slice(0, 10),
          tokenOwnerMatchesYou: claims.sub === currentUserId,
          expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : null,
          secondsRemaining: claims.exp ? claims.exp - now : null,
        },
        // Recorded against the token OWNER, so it shows up in the victim's
        // incident timeline rather than the attacker's.
        audit: { victimUserId: claims.sub, sessionId: claims.session_id ?? null },
      }
    } catch {
      return {
        result: { ok: false, reason: 'Supabase rejected the token. It has probably expired or the session was signed out.' },
        audit: null,
      }
    }
  }

  // Changes the role claim to "service_role" (the all-powerful key's role)
  // without re-signing. Supabase checks the signature first and refuses it.
  async tamper(input: string): Promise<TamperResult | { error: string }> {
    let token: string
    let originalRole: string
    try {
      token = tokenService.extractAccessToken(input)
      originalRole = tokenService.decode(token).role ?? 'unknown'
    } catch (error) {
      return { error: (error as Error).message }
    }

    const forgedRole = 'service_role'
    const forged = tokenService.tamper(token, { role: forgedRole })
    const { error } = await createTokenClient(forged).from('notes').select('id').limit(1)
    return {
      originalRole,
      forgedRole,
      accepted: !error,
      serverMessage: error ? error.message : 'The server accepted the forged token.',
    }
  }
}

export class ReplayExplainService {
  constructor(private readonly llm: LLMClient) {}

  explain(result: ReplayResult): Promise<string> {
    const facts = result.ok
      ? {
          outcome: 'The copied token was accepted without any password or login.',
          notesReadCount: result.notesRead.length,
          tokenBelongsToTheViewer: result.tokenOwnerMatchesYou,
          tokenExpiresAtUtc: result.expiresAt ?? 'unknown',
          secondsRemaining: result.secondsRemaining ?? 'unknown',
          notPossible: [
            'The token contains no password.',
            'Editing any claim breaks the signature, so the server rejects it.',
            'After expiry or sign-out the token stops working.',
            'Row Level Security still limits it to the token owner\'s own rows.',
          ],
        }
      : { outcome: 'The token was rejected.', reason: result.reason }
    return this.llm.generate({ system: DEMO_SYSTEM_PROMPT, prompt: withFacts(facts), maxOutputTokens: 400 })
  }
}

export const replayService = new ReplayService()
