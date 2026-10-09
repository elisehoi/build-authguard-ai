import { createHash } from 'node:crypto'
import { checkPassword, type PasswordCheckResult } from './password'

export type { PasswordCheckResult }

export type AuthGuardConfig = {
  /** Full URL of the Events API, e.g. https://example.com/api/v1/events */
  endpoint: string
  apiKey: string
  appId: string
  /** Long random secret mixed into every hash so they cannot be looked up. */
  ipSalt: string
}

/** Any object with a `headers.get()`: a fetch Request, or Next's `headers()` result. */
export type AuthGuardRequest = { headers: { get(name: string): string | null } }

export type SessionClaims = {
  session_id?: string
  sub?: string
  iat?: number
  exp?: number
  aal?: string
  role?: string
}

type EventType = 'login_success' | 'login_failed' | 'signup' | 'password_check' | 'session_seen' | 'token_invalid'

type OutgoingEvent = {
  event_type: EventType
  session_id?: string
  user_ref?: string
  email_hash?: string
  user_agent?: string
  ip_hash?: string
  payload: Record<string, unknown>
}

const TIMEOUT_MS = 2000

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function createAuthGuard(config: AuthGuardConfig) {
  const hashEmail = (email: string) => sha256(`${config.ipSalt}:email:${email.trim().toLowerCase()}`)
  const hashIp = (ip: string) => sha256(`${config.ipSalt}:ip:${ip}`)

  // Reads headers synchronously so callers may defer the send (for example
  // with Next's after()) without touching request-scoped APIs later.
  function describeClient(request: AuthGuardRequest): Pick<OutgoingEvent, 'user_agent' | 'ip_hash'> {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const ip = forwarded || request.headers.get('x-real-ip') || undefined
    return {
      user_agent: request.headers.get('user-agent') ?? undefined,
      ip_hash: ip ? hashIp(ip) : undefined,
    }
  }

  // Monitoring must never break the host app: every failure is swallowed.
  async function send(event: OutgoingEvent): Promise<void> {
    try {
      await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-authguard-key': config.apiKey },
        body: JSON.stringify({ app_id: config.appId, occurred_at: new Date().toISOString(), ...event }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
    } catch {
      // Ignored on purpose.
    }
  }

  function safely(build: () => OutgoingEvent): Promise<void> {
    try {
      return send(build())
    } catch {
      return Promise.resolve()
    }
  }

  return {
    hashEmail,

    /** Runs locally on the server. The password is never sent or logged. */
    async checkPassword(password: string): Promise<PasswordCheckResult | null> {
      try {
        return await checkPassword(password)
      } catch {
        return null
      }
    },

    trackLogin(input: { success: boolean; userId?: string; email: string; request: AuthGuardRequest }) {
      return safely(() => ({
        event_type: input.success ? 'login_success' : 'login_failed',
        user_ref: input.userId,
        email_hash: hashEmail(input.email),
        ...describeClient(input.request),
        payload: {},
      }))
    },

    trackSignup(input: { userId: string; request: AuthGuardRequest }) {
      return safely(() => ({
        event_type: 'signup',
        user_ref: input.userId,
        ...describeClient(input.request),
        payload: {},
      }))
    },

    trackPasswordCheck(input: {
      userId?: string
      emailHash: string
      result: PasswordCheckResult
      context: 'signup' | 'login'
    }) {
      return safely(() => ({
        event_type: 'password_check',
        user_ref: input.userId,
        email_hash: input.emailHash,
        payload: { breached: input.result.breached, strength: input.result.strength, context: input.context },
      }))
    },

    /** Sends selected claims from an already verified token, never the token itself. */
    sessionSeen(input: { claims: SessionClaims; request: AuthGuardRequest }) {
      const { claims } = input
      if (!claims.session_id) return Promise.resolve()
      return safely(() => ({
        event_type: 'session_seen',
        session_id: claims.session_id,
        user_ref: claims.sub,
        ...describeClient(input.request),
        payload: { iat: claims.iat, exp: claims.exp, aal: claims.aal, role: claims.role },
      }))
    },

    /** Call when an auth cookie is present but could not be verified. */
    tokenInvalid(input: { request: AuthGuardRequest }) {
      return safely(() => ({
        event_type: 'token_invalid',
        ...describeClient(input.request),
        payload: {},
      }))
    },
  }
}

export type AuthGuard = ReturnType<typeof createAuthGuard>
