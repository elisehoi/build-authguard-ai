import 'server-only'
import { cache } from 'react'
import { getServerEnv } from '@/lib/env'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// Anyone can have an AuthGuard account. Only confirmed emails on
// AUTHGUARD_ADMIN_EMAILS own the Werkstatt demo app and see its data;
// everyone else has no connected apps yet.
export type ConsoleAccess = { status: 'anonymous' } | { status: 'ok'; email: string; ownsDemoApp: boolean }

function adminEmails(): string[] {
  try {
    return getServerEnv('authguardConsole').AUTHGUARD_ADMIN_EMAILS
  } catch {
    return []
  }
}

export const getConsoleAccess = cache(async (): Promise<ConsoleAccess> => {
  const supabase = await createAuthGuardClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return { status: 'anonymous' }

  const email = user.email?.toLowerCase() ?? ''
  const ownsDemoApp = Boolean(email && user.email_confirmed_at && adminEmails().includes(email))
  return { status: 'ok', email: email || 'Signed in', ownsDemoApp }
})

/** True when the visitor may see the demo app's data. Pages use it to render nothing otherwise. */
export async function ownsDemoApp(): Promise<boolean> {
  const access = await getConsoleAccess()
  return access.status === 'ok' && access.ownsDemoApp
}
