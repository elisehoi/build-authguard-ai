import 'server-only'
import { z } from 'zod'
import type { ChatMessage, LLMClient, StreamHandle } from '@/lib/ai/llm-client'
import { ASSISTANT_SYSTEM_PROMPT, withFacts } from '@/lib/ai/prompts'
import type { buildAssistantFacts } from './console-data'

type AuthFacts = ReturnType<typeof buildAssistantFacts>

export const MAX_MESSAGE_CHARS = 500
export const MAX_HISTORY = 10

// Accepts the AI SDK UI message shape, but keeps only plain text parts so the
// client cannot smuggle tool calls or extra roles (like "system") into the prompt.
const uiMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()),
})

export const assistantRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(100),
})

export function toChatMessages(input: z.infer<typeof assistantRequestSchema>['messages']): ChatMessage[] | string {
  const recent = input.slice(-MAX_HISTORY).map((message) => ({
    role: message.role,
    content: message.parts
      .filter((part) => part.type === 'text' && part.text)
      .map((part) => part.text)
      .join('\n')
      .trim(),
  }))
  const last = recent.at(-1)
  if (!last || last.role !== 'user' || !last.content) return 'The last message must be a non-empty user message.'
  if (recent.some((message) => message.role === 'user' && message.content.length > MAX_MESSAGE_CHARS)) {
    return `Messages are limited to ${MAX_MESSAGE_CHARS} characters.`
  }
  return recent.filter((message) => message.content)
}

export class AssistantService {
  constructor(private readonly llm: LLMClient) {}

  reply(messages: ChatMessage[], facts: AuthFacts): StreamHandle {
    return this.llm.stream({
      system: `${ASSISTANT_SYSTEM_PROMPT}\n\n${withFacts(facts)}`,
      messages,
      maxOutputTokens: 600,
    })
  }
}
