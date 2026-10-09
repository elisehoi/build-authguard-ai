import type { Metadata } from 'next'
import { PageHeading } from '@/components/app/page-heading'
import { FeatureLinks } from '@/components/dashboard/feature-links'
import { NoteComposer } from '@/components/dashboard/note-composer'
import { NotesList } from '@/components/dashboard/notes-list'
import { NotesRepository } from '@/lib/repositories/notes-repository'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'Notes' }

export default async function DashboardPage() {
  const { supabase } = await loadProtectedPage('/dashboard')
  const notes = await new NotesRepository(supabase).list()

  return (
    <>
      <PageHeading eyebrow="Row Level Security" title="Your private notes">
        These notes are fetched with the public anon key, the same key every visitor has. What keeps them private is a
        database policy: <code className="font-mono text-sm text-foreground">auth.uid() = user_id</code>. Postgres reads
        your user id from the signed token and filters every row itself.
      </PageHeading>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="notes-heading" className="flex flex-col gap-4">
          <h2 id="notes-heading" className="sr-only">
            Notes
          </h2>
          <NoteComposer />
          <NotesList notes={notes} />
        </section>
        <FeatureLinks />
      </div>
    </>
  )
}
