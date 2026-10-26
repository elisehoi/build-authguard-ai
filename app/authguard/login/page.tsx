import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { login, signInWithGoogle } from '@/app/authguard/auth/actions'
import { LoginForm } from '@/components/auth/login-form'
import { AuthCard } from '@/components/authguard/auth-card'
import { AUTH_ERROR_MESSAGES, authErrorMessage } from '@/lib/auth/messages'
import { AUTHGUARD_HOME, AUTHGUARD_SIGNUP } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getConsoleAccess } from '@/lib/services/console-access'
import { getAuthGuardAuthSettings } from '@/lib/supabase/authguard/settings'

export const metadata: Metadata = { title: { absolute: 'Log in · AuthGuard' }, robots: { index: false } }

// Outside the (console) group, so the console layout does not run here.
export default async function ConsoleLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  // Always pass a next, so a successful login lands in the console.
  const next = safeNextPath(typeof params.next === 'string' ? params.next : undefined, AUTHGUARD_HOME, AUTHGUARD_HOME)

  // The proxy already found the database unreachable: say so straight away
  // instead of waiting for the same timeout again.
  const knownUnavailable = params.error === 'unavailable'
  const access = knownUnavailable ? { status: 'unavailable' as const } : await getConsoleAccess()
  if (access.status === 'ok') redirect(next)
  // The settings call doubles as a health check; skip it when the answer is already known.
  const settings = access.status === 'unavailable' ? { reachable: false, google: false } : await getAuthGuardAuthSettings()

  const unavailable = access.status === 'unavailable' || !settings.reachable
  // Only known codes are shown, so a crafted ?error= cannot put text on the page.
  const notice = unavailable ? AUTH_ERROR_MESSAGES.unavailable : authErrorMessage(params.error)

  return (
    <AuthCard title="Log in" description="Sign in to see alerts and events from your connected apps.">
      <LoginForm
        action={login}
        googleAction={settings.google ? signInWithGoogle : undefined}
        signupHref={AUTHGUARD_SIGNUP}
        next={next}
        urlError={notice}
      />
    </AuthCard>
  )
}
