import 'server-only'
import { getAuthGuardPublicEnv } from '@/lib/env.public'
import { fetchAuthSettings, type AuthSettings } from '../auth-settings'

// Whether AuthGuard's Supabase project is reachable and has Google sign-in on,
// so the Google button only appears when it works.
export function getAuthGuardAuthSettings(): Promise<AuthSettings> {
  const env = getAuthGuardPublicEnv()
  return fetchAuthSettings(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
