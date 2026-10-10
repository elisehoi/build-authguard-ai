import 'server-only'
import { NextResponse } from 'next/server'
import type { z } from 'zod'

export type ApiError = { error: { code: string; message: string } }

export function jsonError(status: 400 | 401 | 403 | 404 | 429 | 500 | 502, code: string, message: string) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status })
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse<ApiError> }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ok: false, response: jsonError(400, 'invalid_json', 'Request body must be valid JSON.') }
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ')
    return { ok: false, response: jsonError(400, 'invalid_body', message) }
  }
  return { ok: true, data: result.data }
}

// Logs only the error message (never request bodies, tokens or headers) and
// maps configuration problems to a clear 500 instead of a vague failure.
export function routeError(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`[${context}] ${message}`)
  if (message.startsWith('Missing or invalid environment variable')) {
    return jsonError(500, 'not_configured', message)
  }
  return jsonError(502, 'upstream_error', 'The request could not be completed. Please try again.')
}

export function getRequestOrigin(headers: Headers): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000'
  const proto = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function getClientIp(headers: Headers): string | null {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null
}
