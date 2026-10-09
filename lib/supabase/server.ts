import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getPublicEnv } from '@/lib/env.public'

// A new client per request: the client is bound to that request's cookies,
// so sharing one across requests would mix up users' sessions.
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const env = getPublicEnv()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot set cookies. That is fine because the
          // proxy refreshes the session cookie on every request anyway.
        }
      },
    },
  })
}
