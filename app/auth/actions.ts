'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getRequestOrigin } from '@/lib/http'
import { safeNextPath } from '@/lib/safe-redirect'
import { sessionEventService } from '@/lib/services/session-event-service'
import { tokenService } from '@/lib/services/token-service'
import { createClient } from '@/lib/supabase/server'

export type AuthField = 'email' | 'password' | 'confirmPassword'
export type AuthFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Partial<Record<AuthField, string>> }
  | { status: 'check-email'; email: string }

const emailSchema = z.email('Enter a valid email address.').max(254)

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(72),
})

const signupSchema = z
  .object({
    email: emailSchema,
    // bcrypt only uses the first 72 bytes, so longer passwords add nothing.
    password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Use at most 72 characters.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

function fieldErrors(error: z.ZodError): Partial<Record<AuthField, string>> {
  const result: Partial<Record<AuthField, string>> = {}
  for (const issue of error.issues) {
    const key = issue.path[0] as AuthField
    result[key] ??= issue.message
  }
  return result
}

// Login runs on the server (not in the browser) so the raw Supabase error
// never reaches the client, and so failed attempts can be audited.
export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { status: 'error', message: 'Please confirm your email first. Check your inbox for the link.' }
    }
    if (error.status === 429) {
      return { status: 'error', message: 'Too many attempts. Wait a minute and try again.' }
    }
    if (error.code === 'invalid_credentials') {
      await sessionEventService.recordFailedLogin(parsed.data.email)
      // Same message for "no such user" and "wrong password", so the form
      // cannot be used to discover which emails have accounts.
      return { status: 'error', message: 'Invalid email or password.' }
    }
    console.error(`[auth] Unexpected login error: ${error.code ?? error.status}`)
    return { status: 'error', message: 'Something went wrong while signing in. Please try again.' }
  }

  const claims = tokenService.decode(data.session.access_token)
  await sessionEventService.record({ userId: data.user.id, sessionId: claims.session_id ?? null, eventType: 'login_success' })
  redirect(safeNextPath(formData.get('next')?.toString()))
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) }

  const origin = getRequestOrigin(await headers())
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // In the v0 preview, the redirect proxy forwards the confirmation link
      // to this app's /auth/callback. In production, the origin is used.
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === 'weak_password') return { status: 'error', message: error.message, fieldErrors: { password: 'Choose a stronger password.' } }
    if (error.code === 'email_address_invalid') return { status: 'error', message: 'This email address cannot be used.', fieldErrors: { email: 'Use a real email address you control.' } }
    if (error.status === 429) return { status: 'error', message: 'Too many sign-up emails were sent. Try again later.' }
    if (error.code === 'user_already_exists') return { status: 'check-email', email: parsed.data.email }
    console.error(`[auth] Unexpected sign-up error: ${error.code ?? error.status}`)
    return { status: 'error', message: 'Something went wrong while creating your account. Please try again.' }
  }

  // With email confirmation turned off, Supabase signs the user in immediately.
  if (data.session) redirect('/dashboard')
  return { status: 'check-email', email: parsed.data.email }
}

// OAuth: the browser is sent to Google, so this app never sees the Google
// password. Supabase stores a PKCE code verifier in a cookie here, and
// /auth/callback later proves it owns that verifier when exchanging the code.
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const origin = getRequestOrigin(await headers())
  const next = safeNextPath(formData.get('next')?.toString())
  const callback = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${origin}/auth/callback`
  const redirectTo = next === '/dashboard' ? callback : `${callback}?next=${encodeURIComponent(next)}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error || !data.url) {
    console.error(`[auth] Google sign-in could not start: ${error?.code ?? 'no_url'}`)
    redirect(`/login?error=${encodeURIComponent('Google sign-in is not available right now.')}`)
  }
  redirect(data.url)
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  // Revokes the session on the server too, so a copied refresh token dies
  // with it. A copied access token still works until it expires (see /demo).
  await supabase.auth.signOut()
  redirect('/login')
}
