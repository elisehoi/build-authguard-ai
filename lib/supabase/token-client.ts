import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnv } from '@/lib/env.public'

// Simulates an attacker: no cookies, no login, just "Authorization: Bearer <token>".
// Supabase cannot tell this apart from the real user, which is the lesson of
// the replay demo. The token is held in memory for one request and discarded.
export function createTokenClient(accessToken: string): SupabaseClient {
  const env = getPublicEnv()
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
