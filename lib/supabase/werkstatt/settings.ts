import 'server-only'
import { getWerkstattPublicEnv } from '@/lib/env.public'
import { fetchAuthSettings, type AuthSettings } from '../auth-settings'

// Whether Werkstatt's Supabase project is reachable and has Google sign-in on,
// so the Google button only appears when it works.
export function getWerkstattAuthSettings(): Promise<AuthSettings> {
  const env = getWerkstattPublicEnv()
  return fetchAuthSettings(env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL, env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY)
}
