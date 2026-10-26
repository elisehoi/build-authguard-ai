import 'server-only'
import { headers } from 'next/headers'
import { cache } from 'react'
import { getServerEnv } from '@/lib/env'
import { AUTH_UNAVAILABLE_HEADERS, getUserWithin, isSupabaseUnavailable } from '@/lib/supabase/availability'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// Anyone can have an AuthGuard account. Only confirmed emails on
// AUTHGUARD_ADMIN_EMAILS own the Werkstatt demo app and see its data;
// everyone else has no connected apps yet. In demo mode, every confirmed
// email owns the demo app.
export type ConsoleAccess =
  | { status: 'anonymous' }
  /** AuthGuard's Supabase project could not be reached (paused, waking, timed out). */
  | { status: 'unavailable' }
  | { status: 'ok'; userId: string; email: string; ownsDemoApp: boolean; demoMode: boolean }

/** AUTHGUARD_DEMO_MODE=true opens the demo app to every confirmed account. Anything else keeps it closed. */
export function isDemoMode(): boolean {
  return process.env.AUTHGUARD_DEMO_MODE === 'true'
}

/** The app id that AUTHGUARD_ADMIN_EMAILS own (the Werkstatt demo). */
export function demoAppId(): string {
  try {
    return getServerEnv('authguardConsole').AUTHGUARD_APP_ID
  } catch {
    return process.env.AUTHGUARD_APP_ID || 'werkstatt-demo'
  }
}

function adminEmails(): string[] {
  try {
    return getServerEnv('authguardConsole').AUTHGUARD_ADMIN_EMAILS
  } catch {
    return []
  }
}

export const getConsoleAccess = cache(async (): Promise<ConsoleAccess> => {
  // The proxy already waited for Supabase on this request and got no answer.
  if ((await headers()).get(AUTH_UNAVAILABLE_HEADERS.authguard)) return { status: 'unavailable' }
  const supabase = await createAuthGuardClient()
  const { user, error } = await getUserWithin(supabase)
  if (!user) return isSupabaseUnavailable(error) ? { status: 'unavailable' } : { status: 'anonymous' }

  const email = user.email?.toLowerCase() ?? ''
  const demoMode = isDemoMode()
  const ownsDemoApp = Boolean(email && user.email_confirmed_at && (demoMode || adminEmails().includes(email)))
  return { status: 'ok', userId: user.id, email: email || 'Signed in', ownsDemoApp, demoMode }
})

/** True when the visitor may see the demo app's data. Pages use it to render nothing otherwise. */
export async function ownsDemoApp(): Promise<boolean> {
  const access = await getConsoleAccess()
  return access.status === 'ok' && access.ownsDemoApp
}
