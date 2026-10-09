import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Product-neutral: each product's proxy passes its own project and paths.
export type RefreshConfig = {
  url: string
  anonKey: string
  cookieName?: string
  loginPath: string
  isProtected: (pathname: string) => boolean
  /** Runs just before an unauthenticated visitor is redirected to the login page. */
  onRedirectToLogin?: () => void
}

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function refreshSession(request: NextRequest, config: RefreshConfig): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(config.url, config.anonKey, {
    cookieOptions: config.cookieName ? { name: config.cookieName } : undefined,
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && config.isProtected(request.nextUrl.pathname)) {
    config.onRedirectToLogin?.()
    const url = request.nextUrl.clone()
    url.pathname = config.loginPath
    url.search = ''
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Return this exact response object so refreshed cookies reach the browser.
  return response
}
