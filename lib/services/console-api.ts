import 'server-only'
import type { NextResponse } from 'next/server'
import { AUTH_ERROR_MESSAGES } from '@/lib/auth/messages'
import { jsonError, routeError, type ApiError } from '@/lib/http'
import { takeAiRequest } from './ai-rate-limit'
import { getConsoleAccess } from './console-access'

export const DEMO_LIMIT_MESSAGE = 'Demo limit reached, please try again later.'

// Every console API route calls this first: a login AND ownership of a connected app.
export async function denyUnlessAdmin(): Promise<NextResponse<ApiError> | null> {
  const access = await getConsoleAccess()
  if (access.status === 'unavailable') return jsonError(503, 'unavailable', AUTH_ERROR_MESSAGES.unavailable)
  if (access.status === 'anonymous') return jsonError(401, 'unauthenticated', 'Please log in again.')
  if (!access.ownsDemoApp) return jsonError(403, 'no_connected_apps', 'This account has no connected apps yet.')
  return null
}

// AI routes (assistant, explain, report) call this after denyUnlessAdmin.
// Outside demo mode there is no limit, exactly as before.
export async function denyOverAiLimit(): Promise<NextResponse<ApiError> | null> {
  const access = await getConsoleAccess()
  if (access.status !== 'ok' || !access.demoMode) return null
  try {
    return (await takeAiRequest(access.userId)) ? null : jsonError(429, 'demo_limit', DEMO_LIMIT_MESSAGE)
  } catch (error) {
    return routeError(error, 'ai-limit')
  }
}
