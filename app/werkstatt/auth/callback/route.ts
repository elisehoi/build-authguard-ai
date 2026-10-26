import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCode } from '@/lib/auth/flows'
import { withAuthError, type AuthErrorCode } from '@/lib/auth/messages'
import { reportAuthAttempt } from '@/lib/authguard'
import { getSiteOrigin } from '@/lib/http'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createWerkstattClient } from '@/lib/supabase/werkstatt/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getSiteOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'), WERKSTATT_HOME, WERKSTATT_ACCOUNT)
  const failure = (code: AuthErrorCode) => NextResponse.redirect(`${origin}${withAuthError(WERKSTATT_LOGIN, code)}`)

  if (searchParams.get('error_description') ?? searchParams.get('error')) return failure('oauth_failed')

  const code = searchParams.get('code')
  if (!code) return failure('link_incomplete')

  const result = await exchangeCode(await createWerkstattClient(), code)
  if (!result.ok) return failure(result.code)

  if (result.email) await reportAuthAttempt({ email: result.email, userId: result.userId, success: true })
  return NextResponse.redirect(`${origin}${next}`)
}
