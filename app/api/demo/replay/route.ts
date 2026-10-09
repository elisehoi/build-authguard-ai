import { NextResponse } from 'next/server'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { getAuthContext } from '@/lib/services/auth-context'
import { replayRequestSchema, replayService } from '@/lib/services/replay-service'
import { sessionEventService } from '@/lib/services/session-event-service'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  const body = await parseJsonBody(request, replayRequestSchema)
  if (!body.ok) return body.response

  try {
    const { result, audit } = await replayService.replay(body.data.token, context.user.id)
    // Only the session id is stored. The pasted token is never persisted.
    if (audit) {
      await sessionEventService.record({ userId: audit.victimUserId, sessionId: audit.sessionId, eventType: 'token_replay' })
    }
    return NextResponse.json(result)
  } catch (error) {
    return routeError(error, 'demo/replay')
  }
}
