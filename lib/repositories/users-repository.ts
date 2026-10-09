import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export class UsersRepository {
  constructor(private readonly db: SupabaseClient) {}

  // Calls a security-definer SQL function that only the service role may run.
  // Used to attach failed logins to the right account without storing emails.
  async findIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.db.rpc('user_id_by_email', { lookup_email: email })
    if (error) throw new Error(`Could not look up user: ${error.message}`)
    return z.string().nullable().parse(data)
  }

  async isRlsEnabled(table: 'notes' | 'profiles' | 'session_events'): Promise<boolean | null> {
    const { data, error } = await this.db.rpc('is_rls_enabled', { target_table: table })
    if (error) return null
    return z.boolean().nullable().parse(data)
  }
}
