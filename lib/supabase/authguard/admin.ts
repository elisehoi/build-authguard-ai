import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { getAuthGuardPublicEnv } from '@/lib/env.public'
import { getServerEnv } from '@/lib/env'

// The service role key BYPASSES Row Level Security. It belongs to AuthGuard's
// project and is used only for the authguard_* tables (the Events API writes,
// the console reads). Never pass this client to user-facing reads.
let adminClient: SupabaseClient | null = null

export function createAuthGuardAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  const { NEXT_PUBLIC_SUPABASE_URL } = getAuthGuardPublicEnv()
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv('supabaseAdmin')
  adminClient = createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}
