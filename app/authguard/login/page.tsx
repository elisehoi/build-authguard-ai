import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { login, signInWithGoogle } from '@/app/authguard/auth/actions'
import { LoginForm } from '@/components/auth/login-form'
import { AuthCard } from '@/components/authguard/auth-card'
import { AUTHGUARD_HOME, AUTHGUARD_SIGNUP } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getConsoleAccess } from '@/lib/services/console-access'

export const metadata: Metadata = { title: { absolute: 'Log in · AuthGuard' }, robots: { index: false } }

// Outside the (console) group, so the console layout does not run here.
export default async function ConsoleLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  // Always pass a next, so a successful login lands in the console.
  const next = safeNextPath(typeof params.next === 'string' ? params.next : undefined, AUTHGUARD_HOME, AUTHGUARD_HOME)
  // Rendered as escaped text by React; length is capped.
  const urlError = typeof params.error === 'string' ? params.error.slice(0, 200) : undefined

  if ((await getConsoleAccess()).status === 'ok') redirect(next)

  return (
    <AuthCard title="Log in" description="Sign in to see alerts and events from your connected apps.">
      <LoginForm action={login} googleAction={signInWithGoogle} signupHref={AUTHGUARD_SIGNUP} next={next} urlError={urlError} />
    </AuthCard>
  )
}
