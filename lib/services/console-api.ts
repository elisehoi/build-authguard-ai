import 'server-only'
import type { NextResponse } from 'next/server'
import { jsonError, type ApiError } from '@/lib/http'
import { getConsoleAccess } from './console-access'

// Every console API route calls this first: a login AND ownership of a connected app.
export async function denyUnlessAdmin(): Promise<NextResponse<ApiError> | null> {
  const access = await getConsoleAccess()
  if (access.status === 'anonymous') return jsonError(401, 'unauthenticated', 'Please log in again.')
  if (!access.ownsDemoApp) return jsonError(403, 'no_connected_apps', 'This account has no connected apps yet.')
  return null
}
