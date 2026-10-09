// Only same-site relative paths are allowed after login. "//evil.com" or
// "https://evil.com" would otherwise turn the login page into an open redirect.
export function safeNextPath(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
