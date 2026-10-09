import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed middleware.ts to proxy.ts. It runs before every matched
// request so the session cookie is refreshed before any page reads it.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Skip static assets and the Stripe webhook (Stripe sends no cookies, and
  // the webhook must read the untouched raw body to verify the signature).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
