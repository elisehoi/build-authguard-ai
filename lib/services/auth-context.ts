import 'server-only'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { WERKSTATT_LOGIN } from '@/lib/routes'
import { createWerkstattClient } from '@/lib/supabase/werkstatt/server'
import { z } from 'zod'
import type { SessionClaims } from '@/lib/authguard-sdk'

// Werkstatt's signed-in customer, from Werkstatt's own Supabase project.
// AuthGuard pages use console-access instead and never import this file.

const claimsSchema = z.object({
  sub: z.string(),
  session_id: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  aal: z.string().optional(),
  role: z.string().optional(),
})

// Decoding is not verification: it only reads the payload, and is called
// after getUser() has already verified the session with Supabase Auth.
function decodeClaims(token: string): z.infer<typeof claimsSchema> | null {
  const segment = token.split('.')[1]
  if (!segment) return null
  try {
    const parsed = claimsSchema.safeParse(JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export type AuthContext = { supabase: SupabaseClient; user: User }

// getUser() sends the token to Supabase Auth, which verifies the signature
// and checks the session was not revoked. getSession() only reads the cookie,
// which the browser controls, so it must never be used to decide who a user is.
// cache() dedupes the call within one request, so the layout and the page
// share a single round trip to Supabase Auth.
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createWerkstattClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { supabase, user: data.user }
})

export async function requireAuthContext(nextPath: string): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect(`${WERKSTATT_LOGIN}?next=${encodeURIComponent(nextPath)}`)
  return context
}

// Reads the access token only AFTER getUser() has verified the user, and only
// to decode claims for display. The sub check guards against a mismatched or
// stale cookie. The raw token never leaves this function.
export async function getVerifiedClaims(context: AuthContext): Promise<SessionClaims | null> {
  const { data } = await context.supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  const claims = decodeClaims(token)
  return claims && claims.sub === context.user.id ? claims : null
}
