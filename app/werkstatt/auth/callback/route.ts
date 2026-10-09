import { NextResponse, type NextRequest } from 'next/server'
import { reportAuthAttempt } from '@/lib/authguard'
import { getRequestOrigin } from '@/lib/http'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createWerkstattClient } from '@/lib/supabase/werkstatt/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'), WERKSTATT_HOME, WERKSTATT_ACCOUNT)
  const failure = (message: string) => NextResponse.redirect(`${origin}${WERKSTATT_LOGIN}?error=${encodeURIComponent(message)}`)

  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) return failure('Sign-in was cancelled or failed. Please try again.')

  const code = searchParams.get('code')
  if (!code) return failure('The sign-in link is incomplete. Please try again.')

  const { data, error } = await (await createWerkstattClient()).auth.exchangeCodeForSession(code)
  if (error) return failure('This sign-in link has expired or was already used. Please log in again.')

  if (data.user.email) await reportAuthAttempt({ email: data.user.email, userId: data.user.id, success: true })
  return NextResponse.redirect(`${origin}${next}`)
}
