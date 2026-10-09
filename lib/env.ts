import 'server-only'
import { z } from 'zod'
import { formatEnvError } from './env-errors'
import { getPublicEnv } from './env.public'

// "server-only" makes the build fail if a client component imports this file,
// so secrets like the service role key can never end up in the browser bundle.

const groups = {
  supabaseAdmin: z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) }),
  llm: z.object({
    // Optional: on Vercel the AI Gateway authenticates automatically via OIDC.
    LLM_API_KEY: z.string().min(1).optional(),
    LLM_MODEL: z.string().min(1).default('openai/gpt-5-mini'),
  }),
  // Used by the Events API to authenticate incoming SDK requests.
  authguardApi: z.object({ AUTHGUARD_API_KEY: z.string().min(16) }),
  // Identifies the connected client app in the console and the status API.
  authguardApp: z.object({ AUTHGUARD_APP_ID: z.string().min(1).default('werkstatt-demo') }),
  // Used by the Werkstatt host app to configure the SDK.
  authguardClient: z.object({
    AUTHGUARD_API_KEY: z.string().min(16),
    AUTHGUARD_APP_ID: z.string().min(1).default('werkstatt-demo'),
    AUTHGUARD_ENDPOINT: z.url().optional(),
    // A long random salt makes hashed IPs and emails impossible to reverse
    // with a lookup table.
    IP_HASH_SALT: z.string().min(16),
  }),
  authguardConsole: z.object({
    AUTHGUARD_ADMIN_EMAILS: z
      .string()
      .min(3)
      .transform((value) =>
        value
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
  }),
} as const

type Groups = typeof groups
type GroupName = keyof Groups
type GroupEnv<G extends GroupName> = z.infer<Groups[G]>

const cache = new Map<GroupName, unknown>()

export function getServerEnv<G extends GroupName>(group: G): GroupEnv<G> {
  const hit = cache.get(group)
  if (hit) return hit as GroupEnv<G>
  const result = groups[group].safeParse(process.env)
  if (!result.success) throw new Error(formatEnvError(result.error))
  cache.set(group, result.data)
  return result.data as GroupEnv<G>
}

export function validateAllEnv(): string[] {
  const problems: string[] = []
  try {
    getPublicEnv()
  } catch (error) {
    problems.push((error as Error).message)
  }
  for (const name of Object.keys(groups) as GroupName[]) {
    try {
      getServerEnv(name)
    } catch (error) {
      problems.push(`[${name}] ${(error as Error).message}`)
    }
  }
  return problems
}
