export const WERKSTATT_HOME = '/werkstatt/account'
export const AUTHGUARD_HOME = '/authguard'

// Only same-site relative paths are allowed after login. "//evil.com" or
// "https://evil.com" would otherwise turn the login page into an open redirect.
export function safeNextPath(next: string | null | undefined, fallback = WERKSTATT_HOME): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

// The two products have separate login pages; the destination decides which one.
export function loginPathFor(next: string | null | undefined): string {
  return next && (next === AUTHGUARD_HOME || next.startsWith(`${AUTHGUARD_HOME}/`)) ? '/authguard/login' : '/werkstatt/login'
}
