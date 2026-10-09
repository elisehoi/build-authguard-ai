import 'server-only'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { tokenService, type TokenClaims } from './token-service'

export type AuthContext = { supabase: SupabaseClient; user: User }

// getUser() sends the token to Supabase Auth, which verifies the signature
// and checks the session was not revoked. getSession() only reads the cookie,
// which the browser controls, so it must never be used to decide who a user is.
// cache() dedupes the call within one request, so the layout and the page
// share a single round trip to Supabase Auth.
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { supabase, user: data.user }
})

export async function requireAuthContext(nextPath: string): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  return context
}

// Reads the access token only AFTER getUser() has verified the user, and only
// to decode claims for display. The sub check guards against a mismatched or
// stale cookie. The raw token never leaves this function.
export async function getVerifiedClaims(context: AuthContext): Promise<TokenClaims | null> {
  const { data } = await context.supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  const claims = tokenService.decode(token)
  return claims.sub === context.user.id ? claims : null
}
