import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signInWithGoogle, signup } from '@/app/werkstatt/auth/actions'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignupForm } from '@/components/auth/signup-form'
import { AUTH_ERROR_MESSAGES } from '@/lib/auth/messages'
import { WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'
import { getWerkstattAuthSettings } from '@/lib/supabase/werkstatt/settings'
import { getAuthState } from '@/lib/werkstatt/auth-context'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage() {
  const state = await getAuthState()
  if (state.status === 'signed-in') redirect(WERKSTATT_ACCOUNT)
  const settings = state.status === 'unavailable' ? { reachable: false, google: false } : await getWerkstattAuthSettings()
  const unavailable = state.status === 'unavailable' || !settings.reachable

  return (
    <AuthShell title="Create your account" description="You'll confirm your email before your first class.">
      <SignupForm
        action={signup}
        googleAction={settings.google ? signInWithGoogle : undefined}
        loginHref={WERKSTATT_LOGIN}
        notice={unavailable ? AUTH_ERROR_MESSAGES.unavailable : undefined}
      />
    </AuthShell>
  )
}
