import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicEnv } from '@/lib/env.public'
import { loginPathFor } from '@/lib/safe-redirect'

export const PROTECTED_PREFIXES = ['/werkstatt/account', '/werkstatt/admin', '/authguard'] as const
const PUBLIC_EXCEPTIONS = ['/authguard/login'] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isProtected(pathname: string): boolean {
  if (PUBLIC_EXCEPTIONS.some((path) => matchesPrefix(pathname, path))) return false
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })
  const env = getPublicEnv()

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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

  if (!user && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = loginPathFor(request.nextUrl.pathname)
    url.search = ''
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Return this exact response object so refreshed cookies reach the browser.
  return response
}
