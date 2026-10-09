import { AUTHGUARD_HOME, AUTHGUARD_LOGIN, WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'

// Only same-site relative paths are allowed after login. "//evil.com" or
// "https://evil.com" would otherwise turn the login page into an open redirect.
export function safeNextPath(next: string | null | undefined, fallback = WERKSTATT_ACCOUNT): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

// The two products have separate login pages; the destination decides which one.
export function loginPathFor(next: string | null | undefined): string {
  return next && (next === AUTHGUARD_HOME || next.startsWith(`${AUTHGUARD_HOME}/`)) ? AUTHGUARD_LOGIN : WERKSTATT_LOGIN
}
