import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed middleware.ts to proxy.ts. It runs before every matched
// request so the session cookie is refreshed before any page reads it.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Skip static assets and the SDK-facing API routes: they authenticate with
  // an API key rather than a session cookie, so there is nothing to refresh.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/v1/events|api/v1/status|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
