import { getPublicEnv } from '@/lib/env.public'

// @supabase/ssr stores the session in a cookie named sb-<project-ref>-auth-token.
// Large sessions are split into numbered chunks (.0, .1, ...).
export function getAuthCookieName(): string {
  const host = new URL(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).hostname
  return `sb-${host.split('.')[0]}-auth-token`
}
