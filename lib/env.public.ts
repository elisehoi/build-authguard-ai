import { z } from 'zod'
import { formatEnvError } from './env-errors'

// Client-safe variables. NEXT_PUBLIC_* values are inlined into the browser
// bundle at build time, so they must be referenced literally (process.env.X)
// for Next.js to replace them. Never put a secret in a NEXT_PUBLIC_ variable.
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export type PublicEnv = z.infer<typeof publicSchema>

let cached: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cached) return cached
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!result.success) throw new Error(formatEnvError(result.error))
  cached = result.data
  return cached
}
