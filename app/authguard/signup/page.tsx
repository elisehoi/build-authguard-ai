import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signInWithGoogle, signup } from '@/app/authguard/auth/actions'
import { SignupForm } from '@/components/auth/signup-form'
import { AuthCard } from '@/components/authguard/auth-card'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { getConsoleAccess } from '@/lib/services/console-access'

export const metadata: Metadata = { title: { absolute: 'Create account · AuthGuard' }, robots: { index: false } }

export default async function ConsoleSignupPage() {
  if ((await getConsoleAccess()).status === 'ok') redirect(AUTHGUARD_HOME)

  return (
    <AuthCard title="Create your AuthGuard account" description="Free to start. Connect an app afterwards to begin monitoring.">
      <SignupForm action={signup} googleAction={signInWithGoogle} loginHref={AUTHGUARD_LOGIN} />
    </AuthCard>
  )
}
