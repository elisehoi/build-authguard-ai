import 'server-only'
import { generateText, Output, streamText } from 'ai'
import { getServerEnv } from '@/lib/env'
import type { GenerateOptions, LLMClient, StreamHandle, StreamOptions, StructuredOptions } from './llm-client'

export class VercelAIClient implements LLMClient {
  constructor(private readonly model: string) {}

  async generate({ system, prompt, maxOutputTokens = 400 }: GenerateOptions): Promise<string> {
    const { text } = await generateText({ model: this.model, system, prompt, maxOutputTokens })
    return text
  }

  async generateStructured<T>({ system, prompt, schema, maxOutputTokens = 900 }: StructuredOptions<T>): Promise<T> {
    const { output } = await generateText({
      model: this.model,
      system,
      prompt,
      maxOutputTokens,
      output: Output.object({ schema }),
    })
    // Validate again: model output is untrusted input like anything else.
    return schema.parse(output)
  }

  stream({ system, messages, maxOutputTokens = 600 }: StreamOptions): StreamHandle {
    const result = streamText({ model: this.model, system, messages, maxOutputTokens })
    return { toResponse: () => result.toUIMessageStreamResponse() }
  }
}

let client: LLMClient | null = null

export function getLLMClient(): LLMClient {
  if (client) return client
  const { LLM_API_KEY, LLM_MODEL } = getServerEnv('llm')
  // The AI SDK's gateway reads AI_GATEWAY_API_KEY. Mapping LLM_API_KEY onto it
  // keeps one documented variable name for this app.
  if (LLM_API_KEY && !process.env.AI_GATEWAY_API_KEY) process.env.AI_GATEWAY_API_KEY = LLM_API_KEY
  client = new VercelAIClient(LLM_MODEL)
  return client
}
