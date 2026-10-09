import type { z } from 'zod'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type GenerateOptions = {
  system: string
  prompt: string
  maxOutputTokens?: number
}

export type StructuredOptions<T> = GenerateOptions & { schema: z.ZodType<T> }

export type StreamOptions = {
  system: string
  messages: ChatMessage[]
  maxOutputTokens?: number
}

export interface StreamHandle {
  toResponse(): Response
}

// Services depend on this interface, never on a vendor SDK (dependency
// inversion), so the provider can be swapped or faked in tests.
export interface LLMClient {
  generate(options: GenerateOptions): Promise<string>
  generateStructured<T>(options: StructuredOptions<T>): Promise<T>
  stream(options: StreamOptions): StreamHandle
}
