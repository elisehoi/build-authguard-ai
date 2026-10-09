import { NextResponse } from 'next/server'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { getAuthContext } from '@/lib/services/auth-context'
import { replayRequestSchema, replayService } from '@/lib/services/replay-service'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  const body = await parseJsonBody(request, replayRequestSchema)
  if (!body.ok) return body.response

  try {
    const result = await replayService.tamper(body.data.token)
    if ('error' in result) return jsonError(400, 'invalid_token', result.error)
    return NextResponse.json(result)
  } catch (error) {
    return routeError(error, 'demo/tamper')
  }
}
