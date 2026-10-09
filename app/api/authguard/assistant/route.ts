import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { AssistantService, assistantRequestSchema, toChatMessages } from '@/lib/services/assistant-service'
import { denyUnlessAdmin } from '@/lib/services/console-api'
import { buildAssistantFacts, loadSnapshot } from '@/lib/services/console-data'

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  const body = await parseJsonBody(request, assistantRequestSchema)
  if (!body.ok) return body.response

  const messages = toChatMessages(body.data.messages)
  if (typeof messages === 'string') return jsonError(400, 'invalid_messages', messages)

  try {
    const facts = buildAssistantFacts(await loadSnapshot())
    return new AssistantService(getLLMClient()).reply(messages, facts).toResponse()
  } catch (error) {
    return routeError(error, 'assistant')
  }
}
