import 'server-only'
import { getWerkstattPublicEnv } from '@/lib/env.public'

// Asks Werkstatt's Supabase project whether Google sign-in is turned on, so
// the button only appears when it works. Email login is always available.
// GET /auth/v1/settings is public (anon key) and returns { external: { google } }.
export async function isWerkstattGoogleEnabled(): Promise<boolean> {
  try {
    const env = getWerkstattPublicEnv()
    const response = await fetch(`${env.NEXT_PUBLIC_WERKSTATT_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_WERKSTATT_SUPABASE_ANON_KEY },
      next: { revalidate: 300 },
    })
    if (!response.ok) return false
    const settings = (await response.json()) as { external?: { google?: unknown } }
    return settings.external?.google === true
  } catch {
    return false
  }
}
