import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const notificationSchema = z.object({
  alert_id: z.string(),
  app_id: z.string(),
  severity: z.enum(['medium', 'high']),
  created_at: z.string(),
  emailed_at: z.string().nullable(),
  read_at: z.string().nullable(),
})
export type Notification = z.infer<typeof notificationSchema>

// Must be given the service-role client: the table has RLS enabled and no policies.
export class NotificationsRepository {
  constructor(private readonly db: SupabaseClient) {}

  /** Inserts only when the alert id is new; returns true if this call created the row. */
  async insertIfNew(row: { alert_id: string; app_id: string; severity: 'medium' | 'high' }): Promise<boolean> {
    const { data, error } = await this.db
      .from('authguard_notifications')
      .upsert(row, { onConflict: 'alert_id', ignoreDuplicates: true })
      .select('alert_id')
    if (error) throw new Error(`Could not record notification: ${error.message}`)
    return (data?.length ?? 0) > 0
  }

  async markEmailed(alertId: string): Promise<void> {
    const { error } = await this.db.from('authguard_notifications').update({ emailed_at: new Date().toISOString() }).eq('alert_id', alertId)
    if (error) throw new Error(`Could not mark notification emailed: ${error.message}`)
  }

  async listUnread(limit = 20): Promise<Notification[]> {
    const { data, error } = await this.db
      .from('authguard_notifications')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`Could not load notifications: ${error.message}`)
    return z.array(notificationSchema).parse(data)
  }

  async countUnread(): Promise<number> {
    const { count, error } = await this.db.from('authguard_notifications').select('alert_id', { count: 'exact', head: true }).is('read_at', null)
    if (error) throw new Error(`Could not count notifications: ${error.message}`)
    return count ?? 0
  }

  async markRead(alertId: string): Promise<void> {
    const { error } = await this.db
      .from('authguard_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('alert_id', alertId)
      .is('read_at', null)
    if (error) throw new Error(`Could not mark notification read: ${error.message}`)
  }
}
