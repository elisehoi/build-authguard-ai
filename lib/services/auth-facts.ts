import 'server-only'
import { getAuthCookieName } from '@/lib/supabase/cookie-name'
import { UsersRepository } from '@/lib/repositories/users-repository'
import type { AuthContext } from './auth-context'
import type { TokenClaims } from './token-service'

export const AUTH_PROVIDERS = ['email + password', 'Google (OAuth 2.0 / OpenID Connect)'] as const

// The single source of facts the AI may use. It deliberately contains no raw
// token, password, IP address, or email: the model never needs them to explain.
export async function buildAuthFacts(context: AuthContext, claims: TokenClaims | null) {
  const lifetimeSeconds = claims?.iat && claims.exp ? claims.exp - claims.iat : null
  return {
    tokenType: 'JWT access token signed by Supabase Auth',
    tokenLifetimeMinutes: lifetimeSeconds ? Math.round(lifetimeSeconds / 60) : 'unknown',
    tokenExpiresAtUtc: claims?.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown',
    role: claims?.role ?? 'unknown',
    audience: claims?.aud ?? 'unknown',
    signInMethod: claims?.amr?.[0]?.method ?? 'unknown',
    assuranceLevel: claims?.aal ?? 'unknown',
    sessionStorage: `HTTP cookies set by @supabase/ssr, named ${getAuthCookieName()} (may be split into .0/.1 chunks). Not HttpOnly, because browser code also reads it.`,
    refreshBehavior: 'A refresh token in the same cookie is used to get a new access token when it expires; the proxy refreshes it on each request.',
    rlsEnabledOnNotes: (await new UsersRepository(context.supabase).isRlsEnabled('notes')) ?? 'unknown',
    authProvidersAvailable: AUTH_PROVIDERS,
    passwordStorage: 'Supabase stores only a bcrypt hash of email passwords. With Google, the password is entered only on Google and never reaches this app.',
  }
}

export type AuthFacts = Awaited<ReturnType<typeof buildAuthFacts>>
