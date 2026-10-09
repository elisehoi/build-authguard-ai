import { NextResponse, type NextRequest } from 'next/server'
import { getRequestOrigin } from '@/lib/http'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'), AUTHGUARD_HOME, AUTHGUARD_HOME)
  const failure = (message: string) => NextResponse.redirect(`${origin}${AUTHGUARD_LOGIN}?error=${encodeURIComponent(message)}`)

  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) return failure(providerError)

  const code = searchParams.get('code')
  if (!code) return failure('The sign-in link is missing its code. Please try again.')

  const { error } = await (await createAuthGuardClient()).auth.exchangeCodeForSession(code)
  if (error) return failure(error.message)
  return NextResponse.redirect(`${origin}${next}`)
}
