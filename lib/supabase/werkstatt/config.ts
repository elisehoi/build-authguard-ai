// Werkstatt's session cookie gets its own name, so it can never be confused
// with AuthGuard's, even if both products point at the same Supabase project
// during development. Chunked cookies are stored as <name>.0, <name>.1, ...
export const WERKSTATT_AUTH_COOKIE = 'sb-werkstatt-auth-token'
