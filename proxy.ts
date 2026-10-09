import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { WERKSTATT_HOME } from '@/lib/routes'
import { matchesPrefix } from '@/lib/supabase/refresh-session'
import { updateAuthGuardSession } from '@/lib/supabase/authguard/middleware'
import { updateWerkstattSession } from '@/lib/supabase/werkstatt/middleware'

// Next.js 16 renamed middleware.ts to proxy.ts. It runs before every matched
// request and refreshes the session of the product being requested only:
// Werkstatt under /werkstatt, AuthGuard on "/", /authguard and /api/authguard.
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl
  if (matchesPrefix(pathname, WERKSTATT_HOME)) return updateWerkstattSession(request, (promise) => event.waitUntil(promise))
  if (pathname === '/' || matchesPrefix(pathname, '/authguard') || matchesPrefix(pathname, '/api/authguard')) {
    return updateAuthGuardSession(request)
  }
  return NextResponse.next({ request })
}

export const config = {
  // Skip static assets and the SDK-facing API routes: they authenticate with
  // an API key rather than a session cookie, so there is nothing to refresh.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/v1/events|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
