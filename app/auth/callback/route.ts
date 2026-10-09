import { NextResponse, type NextRequest } from 'next/server'
import { getRequestOrigin } from '@/lib/http'
import { safeNextPath } from '@/lib/safe-redirect'
import { sessionEventService } from '@/lib/services/session-event-service'
import { tokenService } from '@/lib/services/token-service'
import { createClient } from '@/lib/supabase/server'

// Google (and email links in PKCE mode) send the browser back here with a
// one-time ?code=. Exchanging it on the server, together with the code
// verifier cookie set when the flow began, proves this browser started the
// login, which stops an attacker from injecting their own code.
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get('next'))
  const failure = (message: string) => NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) return failure(providerError)

  const code = searchParams.get('code')
  if (!code) return failure('The sign-in link is missing its code. Please try again.')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failure(error.message)

  const claims = tokenService.decode(data.session.access_token)
  await sessionEventService.record({ userId: data.user.id, sessionId: claims.session_id ?? null, eventType: 'login_success' })
  return NextResponse.redirect(`${origin}${next}`)
}
