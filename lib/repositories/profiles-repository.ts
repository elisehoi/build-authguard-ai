import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { profileSchema, type Profile } from '@/lib/types'

export class ProfilesRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select('id, is_pro, created_at')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(`Could not load profile: ${error.message}`)
    return data ? profileSchema.parse(data) : null
  }

  // Only works with the service role client: there is intentionally no RLS
  // UPDATE policy, so a user can never grant themselves Pro from the browser.
  async markPro(userId: string): Promise<void> {
    const { error } = await this.db.from('profiles').upsert({ id: userId, is_pro: true }, { onConflict: 'id' })
    if (error) throw new Error(`Could not upgrade profile: ${error.message}`)
  }
}
