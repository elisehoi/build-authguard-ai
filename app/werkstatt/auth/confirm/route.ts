import { NextResponse, type NextRequest } from 'next/server'
import { confirmEmail } from '@/lib/auth/flows'
import { withAuthError } from '@/lib/auth/messages'
import { getSiteOrigin } from '@/lib/http'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_LOGIN } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { createWerkstattClient } from '@/lib/supabase/werkstatt/server'

// Target of Werkstatt's email template: {{ .SiteURL }}/werkstatt/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const origin = getSiteOrigin(request.headers)
  const params = request.nextUrl.searchParams
  const result = await confirmEmail(await createWerkstattClient(), params)
  if (!result.ok) return NextResponse.redirect(`${origin}${withAuthError(WERKSTATT_LOGIN, result.code)}`)
  return NextResponse.redirect(`${origin}${safeNextPath(params.get('next'), WERKSTATT_HOME, WERKSTATT_ACCOUNT)}`)
}
