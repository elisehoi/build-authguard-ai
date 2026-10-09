import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getAuthGuardPublicEnv } from '@/lib/env.public'

// AuthGuard's Supabase project, bound to the current request's cookies.
// A new client per request, so sessions of different users never mix.
export async function createAuthGuardClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const env = getAuthGuardPublicEnv()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Server Components cannot set cookies. That is fine because the
          // proxy refreshes the session cookie on every request anyway.
        }
      },
    },
  })
}
