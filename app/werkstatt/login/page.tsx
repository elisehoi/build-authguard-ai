import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { login, signInWithGoogle } from '@/app/werkstatt/auth/actions'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { AUTH_ERROR_MESSAGES, authErrorMessage } from '@/lib/auth/messages'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_SIGNUP } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getWerkstattAuthSettings } from '@/lib/supabase/werkstatt/settings'
import { getAuthState } from '@/lib/werkstatt/auth-context'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? safeNextPath(params.next, WERKSTATT_HOME, WERKSTATT_ACCOUNT) : undefined

  // The proxy already found the database unreachable: say so straight away
  // instead of waiting for the same timeout again.
  const knownUnavailable = params.error === 'unavailable'
  const state = knownUnavailable ? { status: 'unavailable' as const } : await getAuthState()
  if (state.status === 'signed-in') redirect(next ?? WERKSTATT_ACCOUNT)
  // The settings call doubles as a health check; skip it when the answer is already known.
  const settings = state.status === 'unavailable' ? { reachable: false, google: false } : await getWerkstattAuthSettings()

  const unavailable = state.status === 'unavailable' || !settings.reachable
  // Only known codes are shown, so a crafted ?error= cannot put text on the page.
  const notice = unavailable ? AUTH_ERROR_MESSAGES.unavailable : authErrorMessage(params.error)

  return (
    <AuthShell title="Log in" description={settings.google ? 'Use email and password, or let Google vouch for you.' : 'Use your email and password.'}>
      <LoginForm
        action={login}
        googleAction={settings.google ? signInWithGoogle : undefined}
        signupHref={WERKSTATT_SIGNUP}
        next={next}
        urlError={notice}
      />
    </AuthShell>
  )
}
