import { createHash, timingSafeEqual } from 'node:crypto'
import { after } from 'next/server'
import { z } from 'zod'
import { getServerEnv } from '@/lib/env'
import { getSiteOrigin, jsonError, parseJsonBody, routeError } from '@/lib/http'
import { AuthGuardEventsRepository } from '@/lib/repositories/authguard-events-repository'
import { notifyForEvent } from '@/lib/services/notification-service'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'
import { EVENT_TYPES } from '@/lib/types'

const FORBIDDEN_FIELDS = new Set(['password', 'token', 'access_token', 'refresh_token', 'email', 'ip'])

// Hashing both sides gives equal-length buffers, so the compare is constant-time.
function keysMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(provided), digest(expected))
}

function findForbiddenField(value: unknown, depth = 0): string | null {
  if (depth > 5 || typeof value !== 'object' || value === null) return null
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELDS.has(key.toLowerCase())) return key
    const nested = findForbiddenField(child, depth + 1)
    if (nested) return nested
  }
  return null
}

const eventSchema = z.object({
  app_id: z.string().min(1).max(64),
  event_type: z.enum(EVENT_TYPES),
  session_id: z.string().min(1).max(128).optional(),
  user_ref: z.string().min(1).max(128).optional(),
  email_hash: z.string().length(64).regex(/^[0-9a-f]+$/).optional(),
  user_agent: z.string().max(512).optional(),
  ip_hash: z.string().length(64).regex(/^[0-9a-f]+$/).optional(),
  payload: z.record(z.string(), z.unknown()),
  occurred_at: z.iso.datetime({ offset: true }),
})

export async function POST(request: Request) {
  let apiKey: string
  try {
    apiKey = getServerEnv('authguardApi').AUTHGUARD_API_KEY
  } catch (error) {
    return routeError(error, 'events-api')
  }
  if (!keysMatch(request.headers.get('x-authguard-key'), apiKey)) {
    return jsonError(401, 'unauthorized', 'Invalid or missing API key.')
  }

  const body = await parseJsonBody(request, z.looseObject({}))
  if (!body.ok) return body.response
  const forbidden = findForbiddenField(body.data)
  if (forbidden) return jsonError(400, 'forbidden_field', `The field "${forbidden}" must never be sent to AuthGuard.`)

  const parsed = eventSchema.safeParse(body.data)
  if (!parsed.success) {
    return jsonError(400, 'invalid_event', parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; '))
  }

  try {
    const repository = new AuthGuardEventsRepository(createAuthGuardAdminClient())
    const event = parsed.data
    if (event.event_type === 'session_seen' && (await repository.hasRecentSessionSeen(event))) {
      return Response.json({ stored: false, reason: 'duplicate' }, { status: 202 })
    }
    const id = await repository.insert(event)
    // Detection, notification and email run after the response is sent.
    const origin = getSiteOrigin(request.headers)
    after(() => notifyForEvent(id, origin).catch((error) => console.error(`[notifications] ${(error as Error).message}`)))
    return Response.json({ stored: true, id }, { status: 201 })
  } catch (error) {
    return routeError(error, 'events-api')
  }
}
