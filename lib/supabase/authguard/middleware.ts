import type { NextRequest, NextResponse } from 'next/server'
import { getAuthGuardPublicEnv } from '@/lib/env.public'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN, AUTHGUARD_SIGNUP } from '@/lib/routes'
import { AUTH_UNAVAILABLE_HEADERS } from '@/lib/supabase/availability'
import { matchesPrefix, refreshSession } from '@/lib/supabase/refresh-session'

const PUBLIC_EXCEPTIONS = [AUTHGUARD_LOGIN, AUTHGUARD_SIGNUP, `${AUTHGUARD_HOME}/auth`] as const

export function updateAuthGuardSession(request: NextRequest): Promise<NextResponse> {
  const env = getAuthGuardPublicEnv()
  return refreshSession(request, {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    unavailableHeader: AUTH_UNAVAILABLE_HEADERS.authguard,
    loginPath: AUTHGUARD_LOGIN,
    isProtected: (pathname) =>
      matchesPrefix(pathname, AUTHGUARD_HOME) && !PUBLIC_EXCEPTIONS.some((path) => matchesPrefix(pathname, path)),
  })
}
