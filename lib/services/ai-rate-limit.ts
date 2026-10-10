import 'server-only'
import { createAuthGuardAdminClient } from '@/lib/supabase/authguard/admin'

const LIMIT = 30
const WINDOW_MS = 60 * 60 * 1000

/**
 * Demo mode only: counts the user's AI requests in the last hour and records
 * this one when under the limit. Two requests racing at the limit may both
 * pass, which is acceptable for a demo budget.
 */
export async function takeAiRequest(userId: string): Promise<boolean> {
  const db = createAuthGuardAdminClient()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count, error } = await db
    .from('authguard_ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)
  if (error) throw new Error(`Could not check the AI limit: ${error.message}`)
  if ((count ?? 0) >= LIMIT) return false

  const { error: insertError } = await db.from('authguard_ai_usage').insert({ user_id: userId })
  if (insertError) throw new Error(`Could not record AI usage: ${insertError.message}`)
  return true
}
