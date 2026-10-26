import 'server-only'

export type AuthSettings = {
  /** False when the project could not be reached (paused, waking, network error or timeout). */
  reachable: boolean
  /** True when Google sign-in is enabled in the project. */
  google: boolean
}

const TIMEOUT_MS = 3000

// GET /auth/v1/settings is public (anon key) and returns { external: { google } }.
// It doubles as a cheap health check, so the login and signup pages can tell
// visitors the database is asleep before they type anything.
export async function fetchAuthSettings(url: string, anonKey: string): Promise<AuthSettings> {
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (response.status >= 500) return { reachable: false, google: false }
    if (!response.ok) return { reachable: true, google: false }
    const settings = (await response.json()) as { external?: { google?: unknown } }
    return { reachable: true, google: settings.external?.google === true }
  } catch {
    // Network error, timeout, or a non-JSON answer from a paused project.
    return { reachable: false, google: false }
  }
}
