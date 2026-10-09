import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { denyUnlessAdmin } from '@/lib/services/console-api'
import { loadSession } from '@/lib/services/console-data'
import { ExplainService, explainFieldRequestSchema, type ClaimSummary } from '@/lib/services/explain-service'

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  const body = await parseJsonBody(request, explainFieldRequestSchema)
  if (!body.ok) return body.response

  try {
    const events = await loadSession(body.data.sessionId)
    const seen = events.filter((event) => event.event_type === 'session_seen').at(-1)
    if (!seen) return jsonError(404, 'not_found', 'No session_seen event exists for that session.')

    const payload = seen.payload as Record<string, unknown>
    const claims: ClaimSummary = {
      session_id: body.data.sessionId,
      sub: seen.user_ref ?? undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      aal: typeof payload.aal === 'string' ? payload.aal : undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    }
    const explanation = await new ExplainService(getLLMClient()).explain(body.data.field, claims)
    return Response.json({ explanation })
  } catch (error) {
    return routeError(error, 'explain-field')
  }
}
