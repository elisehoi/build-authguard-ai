import 'server-only'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getWerkstattPublicEnv } from '@/lib/env.public'
import { fetchWithTimeout } from '../fetch-with-timeout'
import { WERKSTATT_AUTH_COOKIE } from './config'

// Werkstatt's own Supabase project (logins and notes), bound to the current
// request's cookies. Anon key only: Werkstatt never uses a service role key.
export async function createWerkstattClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const env = getWerkstattPublicEnv()

  return createServerClient(env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL, env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY, {
    cookieOptions: { name: WERKSTATT_AUTH_COOKIE },
    global: { fetch: fetchWithTimeout() },
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
