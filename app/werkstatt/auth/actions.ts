'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AuthFormState } from '@/lib/auth/form-state'
import { withAuthError } from '@/lib/auth/messages'
import { passwordLogin, passwordSignup, startGoogleSignIn } from '@/lib/auth/flows'
import { reportAuthAttempt } from '@/lib/authguard'
import { getSiteOrigin } from '@/lib/http'
import { WERKSTATT_ACCOUNT, WERKSTATT_AUTH_CALLBACK, WERKSTATT_HOME, WERKSTATT_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createWerkstattClient } from '@/lib/supabase/werkstatt/server'

// Werkstatt's own logins, against Werkstatt's Supabase project. Outcomes are
// reported to AuthGuard through the SDK, like any monitored app would.

const nextFrom = (formData: FormData) => safeNextPath(formData.get('next')?.toString(), WERKSTATT_HOME, WERKSTATT_ACCOUNT)

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await passwordLogin(await createWerkstattClient(), formData)
  if (!result.ok) {
    if (result.invalidCredentialsFor) await reportAuthAttempt({ email: result.invalidCredentialsFor, success: false })
    return result.state
  }
  await reportAuthAttempt({ email: result.email, userId: result.userId, success: true, password: result.password, context: 'login' })
  redirect(nextFrom(formData))
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const origin = getSiteOrigin(await headers())
  const result = await passwordSignup(await createWerkstattClient(), formData, `${origin}${WERKSTATT_AUTH_CALLBACK}`)
  if (!result.ok) return result.state
  if (result.userId) {
    await reportAuthAttempt({ email: result.email, userId: result.userId, success: true, password: result.password, context: 'signup' })
  }
  if (result.signedIn) redirect(WERKSTATT_ACCOUNT)
  return { status: 'check-email', email: result.email }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const origin = getSiteOrigin(await headers())
  const next = nextFrom(formData)
  const callback = `${origin}${WERKSTATT_AUTH_CALLBACK}`
  const url = await startGoogleSignIn(await createWerkstattClient(), next === WERKSTATT_ACCOUNT ? callback : `${callback}?next=${encodeURIComponent(next)}`)
  redirect(url ?? withAuthError(WERKSTATT_LOGIN, 'google_unavailable'))
}

export async function logout(): Promise<void> {
  // Revokes the session on the server too, so a copied refresh token dies
  // with it. A copied access token still works until it expires.
  await (await createWerkstattClient()).auth.signOut()
  redirect(WERKSTATT_LOGIN)
}
