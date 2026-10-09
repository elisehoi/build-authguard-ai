import { NextResponse } from 'next/server'
import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { getAuthContext, getVerifiedClaims } from '@/lib/services/auth-context'
import { ExplainService, explainRequestSchema } from '@/lib/services/explain-service'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  // Only { field, level } is accepted. Any value the client might send for
  // the claim itself is ignored: the server re-reads its own claims below.
  const body = await parseJsonBody(request, explainRequestSchema)
  if (!body.ok) return body.response

  const claims = await getVerifiedClaims(context)
  if (!claims) return jsonError(401, 'no_session', 'Your session could not be read. Please sign in again.')

  try {
    const explanation = await new ExplainService(getLLMClient()).explain(body.data.field, body.data.level, claims)
    return NextResponse.json({ explanation })
  } catch (error) {
    return routeError(error, 'explain')
  }
}
