import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { noteSchema, type Note } from '@/lib/types'

// Deliberately has no userId filters: this repository must be given a client
// that carries a user's token, and Row Level Security does the scoping. That
// is exactly what the dashboard and the replay demo set out to prove.
export class NotesRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Note[]> {
    const { data, error } = await this.db
      .from('notes')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(`Could not load notes: ${error.message}`)
    return z.array(noteSchema).parse(data)
  }

  async create(content: string): Promise<void> {
    // user_id is filled by the column default auth.uid(); the RLS insert
    // policy rejects any attempt to write a row for someone else.
    const { error } = await this.db.from('notes').insert({ content })
    if (error) throw new Error(`Could not save note: ${error.message}`)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('notes').delete().eq('id', id)
    if (error) throw new Error(`Could not delete note: ${error.message}`)
  }
}
