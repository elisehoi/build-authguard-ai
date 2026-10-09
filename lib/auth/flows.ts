import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { AuthField, AuthFormState } from './form-state'

// Product-neutral auth steps. Each product's server actions pass in their own
// Supabase client and decide where to redirect and what to report.

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

export type LoginResult =
  | { ok: true; userId: string; email: string; password: string }
  | { ok: false; state: AuthFormState; invalidCredentialsFor?: string }

// Runs on the server (not in the browser) so the raw Supabase error never
// reaches the client.
export async function passwordLogin(supabase: SupabaseClient, formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) {
    return { ok: false, state: { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) } }
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (!error) return { ok: true, userId: data.user.id, ...parsed.data }

  if (error.code === 'email_not_confirmed') {
    return { ok: false, state: { status: 'error', message: 'Please confirm your email first. Check your inbox for the link.' } }
  }
  if (error.status === 429) {
    return { ok: false, state: { status: 'error', message: 'Too many attempts. Wait a minute and try again.' } }
  }
  if (error.code === 'invalid_credentials') {
    // Same message for "no such user" and "wrong password", so the form
    // cannot be used to discover which emails have accounts.
    return { ok: false, state: { status: 'error', message: 'Invalid email or password.' }, invalidCredentialsFor: parsed.data.email }
  }
  console.error(`[auth] Unexpected login error: ${error.code ?? error.status}`)
  return { ok: false, state: { status: 'error', message: 'Something went wrong while signing in. Please try again.' } }
}

export type SignupResult =
  | { ok: true; userId: string | null; email: string; password: string; signedIn: boolean }
  | { ok: false; state: AuthFormState }

export async function passwordSignup(supabase: SupabaseClient, formData: FormData, emailRedirectTo: string): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { ok: false, state: { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: fieldErrors(parsed.error) } }
  }

  const { email, password } = parsed.data
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })

  if (error) {
    if (error.code === 'weak_password') return { ok: false, state: { status: 'error', message: error.message, fieldErrors: { password: 'Choose a stronger password.' } } }
    if (error.code === 'email_address_invalid') return { ok: false, state: { status: 'error', message: 'This email address cannot be used.', fieldErrors: { email: 'Use a real email address you control.' } } }
    if (error.status === 429) return { ok: false, state: { status: 'error', message: 'Too many sign-up emails were sent. Try again later.' } }
    if (error.code === 'user_already_exists') return { ok: false, state: { status: 'check-email', email } }
    console.error(`[auth] Unexpected sign-up error: ${error.code ?? error.status}`)
    return { ok: false, state: { status: 'error', message: 'Something went wrong while creating your account. Please try again.' } }
  }

  // With email confirmation turned off, Supabase signs the user in immediately.
  return { ok: true, userId: data.user?.id ?? null, email, password, signedIn: Boolean(data.session) }
}

// OAuth: the browser is sent to Google, so this app never sees the Google
// password. Supabase stores a PKCE code verifier in a cookie here, and the
// product's /auth/callback later proves it owns that verifier.
export async function startGoogleSignIn(supabase: SupabaseClient, redirectTo: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error || !data.url) {
    console.error(`[auth] Google sign-in could not start: ${error?.code ?? 'no_url'}`)
    return null
  }
  return data.url
}

const confirmSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']),
})

// Used when the email template links to <product>/auth/confirm?token_hash=...&type=email.
// Unlike the PKCE flow, this works even if the link opens in another browser.
export async function confirmEmail(supabase: SupabaseClient, params: URLSearchParams): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = confirmSchema.safeParse({ token_hash: params.get('token_hash'), type: params.get('type') })
  if (!parsed.success) return { ok: false, message: 'This confirmation link is invalid.' }
  const { error } = await supabase.auth.verifyOtp(parsed.data)
  return error ? { ok: false, message: error.message } : { ok: true }
}
