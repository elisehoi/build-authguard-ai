import { z } from 'zod'
import { formatEnvError } from './env-errors'

// Client-safe variables. NEXT_PUBLIC_* values are inlined into the browser
// bundle at build time, so they must be referenced literally (process.env.X)
// for Next.js to replace them. Never put a secret in a NEXT_PUBLIC_ variable.

// AuthGuard's own Supabase project: console logins and all authguard_* tables.
const authGuardSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

// Werkstatt's separate Supabase project: its customer logins and the notes table.
const werkstattSchema = z.object({
  NEXT_PUBLIC_WERKSTATT_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY: z.string().min(1),
})

export type AuthGuardPublicEnv = z.infer<typeof authGuardSchema>
export type WerkstattPublicEnv = z.infer<typeof werkstattSchema>

let authGuardCached: AuthGuardPublicEnv | null = null
let werkstattCached: WerkstattPublicEnv | null = null

export function getAuthGuardPublicEnv(): AuthGuardPublicEnv {
  if (authGuardCached) return authGuardCached
  const result = authGuardSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!result.success) throw new Error(formatEnvError(result.error))
  authGuardCached = result.data
  return authGuardCached
}

export function getWerkstattPublicEnv(): WerkstattPublicEnv {
  if (werkstattCached) return werkstattCached
  const result = werkstattSchema.safeParse({
    NEXT_PUBLIC_WERKSTATT_SUPABASE_URL: process.env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL,
    NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY,
  })
  if (!result.success) throw new Error(formatEnvError(result.error))
  werkstattCached = result.data
  return werkstattCached
}
