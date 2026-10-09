import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signInWithGoogle, signup } from '@/app/werkstatt/auth/actions'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignupForm } from '@/components/auth/signup-form'
import { WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'
import { getAuthContext } from '@/lib/services/auth-context'
import { isWerkstattGoogleEnabled } from '@/lib/supabase/werkstatt/google'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage() {
  if (await getAuthContext()) redirect(WERKSTATT_ACCOUNT)
  const google = await isWerkstattGoogleEnabled()

  return (
    <AuthShell title="Create your account" description="You'll confirm your email before your first class.">
      <SignupForm action={signup} googleAction={google ? signInWithGoogle : undefined} loginHref={WERKSTATT_LOGIN} />
    </AuthShell>
  )
}
