// Only same-site relative paths inside the product's own section are allowed
// after login. "//evil.com" or "https://evil.com" would otherwise turn the
// login page into an open redirect, and a Werkstatt login must never land in
// the AuthGuard console (or the other way round).
export function safeNextPath(next: string | null | undefined, scope: string, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next === scope || next.startsWith(`${scope}/`) ? next : fallback
}
