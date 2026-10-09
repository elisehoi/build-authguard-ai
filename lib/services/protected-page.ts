import 'server-only'
import { after } from 'next/server'
import { getVerifiedClaims, requireAuthContext, type AuthContext } from './auth-context'
import { sessionEventService } from './session-event-service'
import type { TokenClaims } from './token-service'

export type ProtectedPageContext = AuthContext & { claims: TokenClaims | null }

// Every protected page starts here: verify the user, then record a page_view
// tied to the JWT session_id. after() writes the event once the response is
// sent, so auditing adds no latency to the page.
export async function loadProtectedPage(path: string): Promise<ProtectedPageContext> {
  const context = await requireAuthContext(path)
  const claims = await getVerifiedClaims(context)
  const sessionId = claims?.session_id ?? null
  after(() => sessionEventService.record({ userId: context.user.id, sessionId, eventType: 'page_view' }))
  return { ...context, claims }
}
