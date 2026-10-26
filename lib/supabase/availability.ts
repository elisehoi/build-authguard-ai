import { AuthRetryableFetchError, isAuthRetryableFetchError, type SupabaseClient, type User } from '@supabase/supabase-js'

/**
 * True when a Supabase error means "the service could not be reached" rather
 * than "the credentials or session were rejected": a network failure, a
 * timeout, a 5xx answer, or a non-JSON page (which is what a paused or
 * waking project can return). Callers use it so a sleeping database is never
 * reported as a forged token or a wrong password.
 */
export function isSupabaseUnavailable(error: unknown): boolean {
  if (!error) return false
  if (isAuthRetryableFetchError(error)) return true
  if ((error as { name?: unknown }).name === 'AuthUnknownError') return true
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && (status === 0 || status >= 500)
}

/** Longest a page waits for Supabase Auth to answer before treating it as unavailable. */
export const AUTH_CHECK_DEADLINE_MS = 6000

/**
 * Request headers the proxy sets (and always strips from the incoming request
 * first, so a browser cannot send them) when it already found that product's
 * Supabase project unreachable. Pages read them to skip a second wait.
 */
export const AUTH_UNAVAILABLE_HEADERS = {
  werkstatt: 'x-werkstatt-auth-unavailable',
  authguard: 'x-authguard-auth-unavailable',
} as const

/**
 * getUser() with an overall deadline. Each request already has a time limit,
 * but when an access token has expired, supabase-js retries the refresh with
 * back-off for up to 30 seconds, which is what returning visitors would wait
 * for while the database is asleep. Past the deadline the user is reported as
 * unavailable; the abandoned call finishes on its own timeouts.
 */
export async function getUserWithin(
  supabase: SupabaseClient,
  ms = AUTH_CHECK_DEADLINE_MS,
): Promise<{ user: User | null; error: unknown }> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<{ user: null; error: unknown }>((resolve) => {
    timer = setTimeout(() => resolve({ user: null, error: new AuthRetryableFetchError('Supabase Auth did not answer in time.', 0) }), ms)
  })
  const check = supabase.auth.getUser().then(
    ({ data, error }) => ({ user: data.user, error: error as unknown }),
    (error: unknown) => ({ user: null, error }),
  )
  try {
    return await Promise.race([check, deadline])
  } finally {
    clearTimeout(timer)
  }
}
