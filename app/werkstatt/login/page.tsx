import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { login, signInWithGoogle } from '@/app/werkstatt/auth/actions'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_SIGNUP } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getAuthContext } from '@/lib/services/auth-context'
import { isWerkstattGoogleEnabled } from '@/lib/supabase/werkstatt/google'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? safeNextPath(params.next, WERKSTATT_HOME, WERKSTATT_ACCOUNT) : undefined
  // Error text comes from our own redirects; it is rendered as plain text by
  // React (escaped), so a crafted ?error= cannot inject HTML. Length is capped.
  const urlError = typeof params.error === 'string' ? params.error.slice(0, 200) : undefined

  if (await getAuthContext()) redirect(next ?? WERKSTATT_ACCOUNT)
  const google = await isWerkstattGoogleEnabled()

  return (
    <AuthShell title="Log in" description={google ? 'Use email and password, or let Google vouch for you.' : 'Use your email and password.'}>
      <LoginForm
        action={login}
        googleAction={google ? signInWithGoogle : undefined}
        signupHref={WERKSTATT_SIGNUP}
        next={next}
        urlError={urlError}
      />
    </AuthShell>
  )
}
