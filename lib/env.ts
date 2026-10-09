import 'server-only'
import { z } from 'zod'
import { formatEnvError } from './env-errors'
import { getAuthGuardPublicEnv, getWerkstattPublicEnv } from './env.public'

// "server-only" makes the build fail if a client component imports this file,
// so secrets like the service role key can never end up in the browser bundle.

const groups = {
  // AuthGuard's project only. Werkstatt never gets a service role key.
  supabaseAdmin: z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) }),
  llm: z.object({
    // Optional: on Vercel the AI Gateway authenticates automatically via OIDC.
    LLM_API_KEY: z.string().min(1).optional(),
    LLM_MODEL: z.string().min(1).default('openai/gpt-5-mini'),
  }),
  // Used by the Events API to authenticate incoming SDK requests.
  authguardApi: z.object({ AUTHGUARD_API_KEY: z.string().min(16) }),
  // Used by the Werkstatt host app to configure the SDK.
  authguardClient: z.object({
    AUTHGUARD_API_KEY: z.string().min(16),
    AUTHGUARD_APP_ID: z.string().min(1).default('werkstatt-demo'),
    AUTHGUARD_ENDPOINT: z.url().optional(),
    // A long random salt makes hashed IPs and emails impossible to reverse
    // with a lookup table.
    IP_HASH_SALT: z.string().min(16),
  }),
  // Alert emails. Both optional: without them, notifications are still
  // recorded and shown in the console, just not emailed.
  notifications: z.object({
    RESEND_API_KEY: z.string().min(1).optional(),
    AUTHGUARD_ALERT_EMAIL: z.email().optional(),
    // Base URL for links in emails, e.g. https://authguard.example.com.
    AUTHGUARD_PUBLIC_URL: z.url().optional(),
  }),
  authguardConsole: z.object({
    // The connected app that AUTHGUARD_ADMIN_EMAILS own (the Werkstatt demo).
    AUTHGUARD_APP_ID: z.string().min(1).default('werkstatt-demo'),
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

// Without these AuthGuard itself cannot run: its Supabase project, the
// service role for the authguard_* tables, and the Events API key.
const CORE_GROUPS = ['supabaseAdmin', 'authguardApi'] as const satisfies readonly GroupName[]

export function validateAllEnv(): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const collect = (target: string[], label: string, check: () => unknown) => {
    try {
      check()
    } catch (error) {
      target.push(`[${label}] ${(error as Error).message}`)
    }
  }

  collect(errors, 'authguardSupabase', getAuthGuardPublicEnv)
  for (const name of CORE_GROUPS) collect(errors, name, () => getServerEnv(name))

  // Optional features: Werkstatt, its SDK, alert emails, admin list, AI.
  // Each one re-validates when used and fails only that feature.
  collect(warnings, 'werkstattSupabase', getWerkstattPublicEnv)
  for (const name of Object.keys(groups) as GroupName[]) {
    if (!(CORE_GROUPS as readonly GroupName[]).includes(name)) collect(warnings, name, () => getServerEnv(name))
  }
  return { errors, warnings }
}
