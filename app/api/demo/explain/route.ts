import { NextResponse } from 'next/server'
import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { getAuthContext } from '@/lib/services/auth-context'
import { ReplayExplainService, replayRequestSchema, replayService } from '@/lib/services/replay-service'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  const body = await parseJsonBody(request, replayRequestSchema)
  if (!body.ok) return body.response

  try {
    // Facts are recomputed on the server instead of accepting a result
    // object from the browser, which could be edited to mislead the AI.
    const { result } = await replayService.replay(body.data.token, context.user.id)
    const explanation = await new ReplayExplainService(getLLMClient()).explain(result)
    return NextResponse.json({ explanation })
  } catch (error) {
    return routeError(error, 'demo/explain')
  }
}
