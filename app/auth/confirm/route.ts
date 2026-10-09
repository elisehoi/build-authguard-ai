import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getRequestOrigin } from '@/lib/http'
import { safeNextPath } from '@/lib/safe-redirect'
import { createClient } from '@/lib/supabase/server'

const confirmSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']),
})

// Used when the Supabase email template links to
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.
// Unlike the PKCE flow, this works even if the link opens in another browser.
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request.headers)
  const params = request.nextUrl.searchParams
  const parsed = confirmSchema.safeParse({ token_hash: params.get('token_hash'), type: params.get('type') })
  if (!parsed.success) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('This confirmation link is invalid.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp(parsed.data)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }
  return NextResponse.redirect(`${origin}${safeNextPath(params.get('next'))}`)
}
