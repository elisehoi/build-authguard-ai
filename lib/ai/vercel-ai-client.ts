import 'server-only'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output, streamText, type LanguageModel } from 'ai'
import { getServerEnv } from '@/lib/env'
import type { GenerateOptions, LLMClient, StreamHandle, StreamOptions, StructuredOptions } from './llm-client'

// Google Gemini through the AI SDK's Google provider. Services only see the
// LLMClient interface, so nothing outside this file knows the vendor.
export class GeminiClient implements LLMClient {
  constructor(private readonly model: LanguageModel) {}

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
  const { GOOGLE_GENERATIVE_AI_API_KEY, LLM_MODEL } = getServerEnv('llm')
  const google = createGoogleGenerativeAI({ apiKey: GOOGLE_GENERATIVE_AI_API_KEY })
  client = new GeminiClient(google(LLM_MODEL))
  return client
}
