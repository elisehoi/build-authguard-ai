import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnv } from '@/lib/env.public'
import { getServerEnv } from '@/lib/env'

// The service role key BYPASSES Row Level Security. Use it only for writes
// that users must not be able to make themselves: audit events and the
// Stripe webhook flipping is_pro. Never pass this client to user-facing reads.
let adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv()
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv('supabaseAdmin')
  adminClient = createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}
