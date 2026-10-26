import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withAuthError } from '@/lib/auth/messages'
import { getUserWithin, isSupabaseUnavailable } from './availability'
import { fetchWithTimeout } from './fetch-with-timeout'

// Product-neutral: each product's proxy passes its own project and paths.
export type RefreshConfig = {
  url: string
  anonKey: string
  cookieName?: string
  loginPath: string
  isProtected: (pathname: string) => boolean
  /** Request header that tells this product's pages the proxy found Supabase unreachable. */
  unavailableHeader: string
  /**
   * Runs just before a visitor whose session was REJECTED by Supabase Auth is
   * redirected to the login page. It does not run when Supabase could not be
   * reached, so a sleeping database is never reported as a forged token.
   */
  onRedirectToLogin?: () => void
}

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function refreshSession(request: NextRequest, config: RefreshConfig): Promise<NextResponse> {
  // Only the proxy may set this header, never the browser.
  request.headers.delete(config.unavailableHeader)
  let response = NextResponse.next({ request })

  const supabase = createServerClient(config.url, config.anonKey, {
    cookieOptions: config.cookieName ? { name: config.cookieName } : undefined,
    global: { fetch: fetchWithTimeout() },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  // getUser() asks the Supabase Auth server to validate the token, and
  // refreshes it when expired. Do not put code between client creation and
  // this call: a stale cookie could otherwise log users out at random.
  const { user, error } = await getUserWithin(supabase)
  const unavailable = !user && isSupabaseUnavailable(error)

  if (!user && config.isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = config.loginPath
    url.search = ''
    if (unavailable) {
      // Supabase did not answer: the session may be perfectly valid. The
      // cookie is left alone, and the login page explains the outage.
      return NextResponse.redirect(new URL(withAuthError(config.loginPath, 'unavailable', request.nextUrl.pathname), url))
    }
    config.onRedirectToLogin?.()
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (unavailable) {
    // Tell the page, so it shows the visitor as signed out at once instead of
    // waiting for Supabase a second time. Cookies stay untouched.
    request.headers.set(config.unavailableHeader, '1')
    const forwarded = NextResponse.next({ request })
    for (const cookie of response.cookies.getAll()) forwarded.cookies.set(cookie)
    return forwarded
  }

  // Return this exact response object so refreshed cookies reach the browser.
  return response
}
