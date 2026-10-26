import type { NextRequest, NextResponse } from 'next/server'
import { getAuthGuardForRequest } from '@/lib/authguard'
import { getWerkstattPublicEnv } from '@/lib/env.public'
import { WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'
import { AUTH_UNAVAILABLE_HEADERS } from '@/lib/supabase/availability'
import { matchesPrefix, refreshSession } from '@/lib/supabase/refresh-session'
import { WERKSTATT_AUTH_COOKIE } from './config'

// Werkstatt's session cookie (maybe chunked as <name>.0, <name>.1, ...).
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name === WERKSTATT_AUTH_COOKIE || cookie.name.startsWith(`${WERKSTATT_AUTH_COOKIE}.`))
}

export function updateWerkstattSession(request: NextRequest, waitUntil: (promise: Promise<unknown>) => void): Promise<NextResponse> {
  const env = getWerkstattPublicEnv()
  // Read before refreshSession, which may clear a rejected cookie.
  const cookiePresent = hasAuthCookie(request)
  return refreshSession(request, {
    url: env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY,
    cookieName: WERKSTATT_AUTH_COOKIE,
    unavailableHeader: AUTH_UNAVAILABLE_HEADERS.werkstatt,
    loginPath: WERKSTATT_LOGIN,
    isProtected: (pathname) => matchesPrefix(pathname, WERKSTATT_ACCOUNT),
    // A cookie that Supabase Auth rejects is reported to AuthGuard through the
    // SDK, without delaying the redirect.
    onRedirectToLogin: () => {
      if (!cookiePresent) return
      const guard = getAuthGuardForRequest(request)
      if (guard) waitUntil(guard.tokenInvalid({ request }))
    },
  })
}
