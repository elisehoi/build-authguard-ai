'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AuthFormState } from '@/lib/auth/form-state'
import { withAuthError } from '@/lib/auth/messages'
import { passwordLogin, passwordSignup, startGoogleSignIn } from '@/lib/auth/flows'
import { getSiteOrigin } from '@/lib/http'
import { AUTHGUARD_AUTH_CALLBACK, AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// AuthGuard console accounts, against AuthGuard's own Supabase project.

const nextFrom = (formData: FormData) => safeNextPath(formData.get('next')?.toString(), AUTHGUARD_HOME, AUTHGUARD_HOME)

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await passwordLogin(await createAuthGuardClient(), formData)
  if (!result.ok) return result.state
  redirect(nextFrom(formData))
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const origin = getSiteOrigin(await headers())
  const result = await passwordSignup(await createAuthGuardClient(), formData, `${origin}${AUTHGUARD_AUTH_CALLBACK}`)
  if (!result.ok) return result.state
  if (result.signedIn) redirect(AUTHGUARD_HOME)
  return { status: 'check-email', email: result.email }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const origin = getSiteOrigin(await headers())
  const next = nextFrom(formData)
  const callback = `${origin}${AUTHGUARD_AUTH_CALLBACK}`
  const url = await startGoogleSignIn(await createAuthGuardClient(), next === AUTHGUARD_HOME ? callback : `${callback}?next=${encodeURIComponent(next)}`)
  redirect(url ?? withAuthError(AUTHGUARD_LOGIN, 'google_unavailable'))
}

export async function logout(): Promise<void> {
  // Revokes the session on the server too, so a copied refresh token dies
  // with it. A copied access token still works until it expires.
  await (await createAuthGuardClient()).auth.signOut()
  redirect(AUTHGUARD_LOGIN)
}
