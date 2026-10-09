import { NextResponse, type NextRequest } from 'next/server'
import { reportAuthAttempt } from '@/lib/authguard'
import { getRequestOrigin } from '@/lib/http'
import { loginPathFor, safeNextPath } from '@/lib/safe-redirect'
import { createClient } from '@/lib/supabase/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const failure = (message: string) => NextResponse.redirect(`${origin}${loginPathFor(next)}?error=${encodeURIComponent(message)}`)

  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) return failure(providerError)

  const code = searchParams.get('code')
  if (!code) return failure('The sign-in link is missing its code. Please try again.')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failure(error.message)

  if (data.user.email) await reportAuthAttempt({ email: data.user.email, userId: data.user.id, success: true })
  return NextResponse.redirect(`${origin}${next}`)
}
