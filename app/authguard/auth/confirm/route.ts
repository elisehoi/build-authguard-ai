import { NextResponse, type NextRequest } from 'next/server'
import { confirmEmail } from '@/lib/auth/flows'
import { getRequestOrigin } from '@/lib/http'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createAuthGuardClient } from '@/lib/supabase/authguard/server'

// Target of AuthGuard's email template: {{ .SiteURL }}/authguard/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const params = request.nextUrl.searchParams
  const result = await confirmEmail(await createAuthGuardClient(), params)
  if (!result.ok) return NextResponse.redirect(`${origin}${AUTHGUARD_LOGIN}?error=${encodeURIComponent(result.message)}`)
  return NextResponse.redirect(`${origin}${safeNextPath(params.get('next'), AUTHGUARD_HOME, AUTHGUARD_HOME)}`)
}
