import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { AssistantService, assistantRequestSchema, toChatMessages } from '@/lib/services/assistant-service'
import { getAuthContext, getVerifiedClaims } from '@/lib/services/auth-context'
import { buildAuthFacts } from '@/lib/services/auth-facts'

export async function POST(request: Request) {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  const body = await parseJsonBody(request, assistantRequestSchema)
  if (!body.ok) return body.response

  const messages = toChatMessages(body.data.messages)
  if (typeof messages === 'string') return jsonError(400, 'invalid_messages', messages)

  try {
    const facts = await buildAuthFacts(context, await getVerifiedClaims(context))
    return new AssistantService(getLLMClient()).reply(messages, facts).toResponse()
  } catch (error) {
    return routeError(error, 'assistant')
  }
}
