import 'server-only'
import { cache } from 'react'
import { getServerEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export type ConsoleAccess = { status: 'ok'; email: string } | { status: 'anonymous' } | { status: 'forbidden' }

// Supabase login is required AND the verified email must be on the admin list.
export const getConsoleAccess = cache(async (): Promise<ConsoleAccess> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return { status: 'anonymous' }

  let admins: string[]
  try {
    admins = getServerEnv('authguardConsole').AUTHGUARD_ADMIN_EMAILS
  } catch {
    return { status: 'forbidden' }
  }
  const email = user.email?.toLowerCase()
  if (!email || !user.email_confirmed_at || !admins.includes(email)) return { status: 'forbidden' }
  return { status: 'ok', email }
})
