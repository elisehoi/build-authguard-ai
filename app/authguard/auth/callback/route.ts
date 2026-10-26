import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCode } from '@/lib/auth/flows'
import { withAuthError, type AuthErrorCode } from '@/lib/auth/messages'
import { getSiteOrigin } from '@/lib/http'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getSiteOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'), AUTHGUARD_HOME, AUTHGUARD_HOME)
  // Only a fixed code goes into the URL, never the provider's or Supabase's text.
  const failure = (code: AuthErrorCode) => NextResponse.redirect(`${origin}${withAuthError(AUTHGUARD_LOGIN, code)}`)

  if (searchParams.get('error_description') ?? searchParams.get('error')) return failure('oauth_failed')

  const code = searchParams.get('code')
  if (!code) return failure('link_incomplete')

  const result = await exchangeCode(await createAuthGuardClient(), code)
  if (!result.ok) return failure(result.code)
  return NextResponse.redirect(`${origin}${next}`)
}
