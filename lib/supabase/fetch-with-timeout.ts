// Every Supabase request gets a time limit. Without one, a paused, waking or
// unreachable project leaves the browser waiting indefinitely; with one, the
// request fails fast and the app can say what happened.
export const SUPABASE_TIMEOUT_MS = 5000

export function fetchWithTimeout(timeoutMs = SUPABASE_TIMEOUT_MS): typeof fetch {
  return (input, init) => {
    const timeout = AbortSignal.timeout(timeoutMs)
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    return fetch(input, { ...init, signal })
  }
}
