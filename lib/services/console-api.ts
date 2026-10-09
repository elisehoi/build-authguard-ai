import 'server-only'
import type { NextResponse } from 'next/server'
import { jsonError, type ApiError } from '@/lib/http'
import { getConsoleAccess } from './console-access'

// Every console API route calls this first: login AND admin allow list.
export async function denyUnlessAdmin(): Promise<NextResponse<ApiError> | null> {
  const access = await getConsoleAccess()
  if (access.status === 'anonymous') return jsonError(401, 'unauthenticated', 'Please log in again.')
  if (access.status === 'forbidden') return jsonError(403, 'forbidden', 'This account cannot use the AuthGuard console.')
  return null
}
