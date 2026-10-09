import 'server-only'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { createAuthGuard, type AuthGuard, type AuthGuardRequest } from '@/lib/authguard-sdk'
import { getServerEnv } from '@/lib/env'

// The only place Werkstatt touches AuthGuard: it configures the SDK, and the
// SDK talks to the Events API over HTTP like any third-party client would.

let instance: { endpoint: string; guard: AuthGuard } | null = null

function originFrom(requestHeaders: Headers): string {
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000'
  const proto = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/** Returns null (and logs) when AuthGuard is not configured, so login never breaks. */
export async function getAuthGuard(): Promise<AuthGuard | null> {
  try {
    const env = getServerEnv('authguardClient')
    const endpoint = env.AUTHGUARD_ENDPOINT ?? `${originFrom(await headers())}/api/v1/events`
    if (instance?.endpoint !== endpoint) {
      instance = {
        endpoint,
        guard: createAuthGuard({ endpoint, apiKey: env.AUTHGUARD_API_KEY, appId: env.AUTHGUARD_APP_ID, ipSalt: env.IP_HASH_SALT }),
      }
    }
    return instance.guard
  } catch (error) {
    console.error('AuthGuard is not configured:', (error as Error).message)
    return null
  }
}

/** A copy of the request headers that stays readable inside after(). */
export async function snapshotRequest(): Promise<AuthGuardRequest> {
  return { headers: new Headers(await headers()) }
}

type AttemptInput = { email: string; userId?: string; success: boolean; password?: string; context?: 'signup' | 'login' }

// Monitoring only: runs after the response is sent and never blocks or fails the user flow.
export async function reportAuthAttempt(input: AttemptInput): Promise<void> {
  const guard = await getAuthGuard()
  if (!guard) return
  const request = await snapshotRequest()
  after(async () => {
    const { email, userId, success, password, context } = input
    if (password && context) {
      const result = await guard.checkPassword(password)
      if (result) await guard.trackPasswordCheck({ userId, emailHash: guard.hashEmail(email), result, context })
    }
    if (context === 'signup') {
      if (userId) await guard.trackSignup({ userId, request })
    } else {
      await guard.trackLogin({ success, userId, email, request })
    }
  })
}
