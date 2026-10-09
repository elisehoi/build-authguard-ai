import type { NextRequest, NextResponse } from 'next/server'
import { getWerkstattPublicEnv } from '@/lib/env.public'
import { WERKSTATT_ACCOUNT, WERKSTATT_HOME, WERKSTATT_LOGIN } from '@/lib/routes'
import { matchesPrefix, refreshSession } from '@/lib/supabase/refresh-session'
import { WERKSTATT_AUTH_COOKIE } from './config'

const PROTECTED_PREFIXES = [WERKSTATT_ACCOUNT, `${WERKSTATT_HOME}/admin`] as const

export function updateWerkstattSession(request: NextRequest): Promise<NextResponse> {
  const env = getWerkstattPublicEnv()
  return refreshSession(request, {
    url: env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY,
    cookieName: WERKSTATT_AUTH_COOKIE,
    loginPath: WERKSTATT_LOGIN,
    isProtected: (pathname) => PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix)),
  })
}
