import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signInWithGoogle, signup } from '@/app/authguard/auth/actions'
import { SignupForm } from '@/components/auth/signup-form'
import { AuthCard } from '@/components/authguard/auth-card'
import { AUTH_ERROR_MESSAGES } from '@/lib/auth/messages'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { getConsoleAccess } from '@/lib/services/console-access'
import { getAuthGuardAuthSettings } from '@/lib/supabase/authguard/settings'

export const metadata: Metadata = { title: { absolute: 'Create account · AuthGuard' }, robots: { index: false } }

export default async function ConsoleSignupPage() {
  const access = await getConsoleAccess()
  if (access.status === 'ok') redirect(AUTHGUARD_HOME)
  const settings = access.status === 'unavailable' ? { reachable: false, google: false } : await getAuthGuardAuthSettings()
  const unavailable = access.status === 'unavailable' || !settings.reachable

  return (
    <AuthCard title="Create your AuthGuard account" description="Create an account to connect your first app.">
      <SignupForm
        action={signup}
        googleAction={settings.google ? signInWithGoogle : undefined}
        loginHref={AUTHGUARD_LOGIN}
        notice={unavailable ? AUTH_ERROR_MESSAGES.unavailable : undefined}
      />
    </AuthCard>
  )
}
