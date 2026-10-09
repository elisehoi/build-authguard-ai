import type { Metadata } from 'next'
import { NoteComposer } from '@/components/dashboard/note-composer'
import { NotesList } from '@/components/dashboard/notes-list'
import { NotesRepository } from '@/lib/repositories/notes-repository'
import { WERKSTATT_ACCOUNT } from '@/lib/routes'
import { requireAuthContext } from '@/lib/services/auth-context'

export const metadata: Metadata = { title: 'My workshop notes' }

export default async function AccountPage() {
  const { supabase } = await requireAuthContext(WERKSTATT_ACCOUNT)
  const notes = await new NotesRepository(supabase).list()

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My workshop notes</h1>
        <p className="text-muted-foreground">Measurements, finishes and reminders from your classes. Only you can see them.</p>
      </div>
      <NoteComposer />
      <NotesList notes={notes} />
    </>
  )
}
