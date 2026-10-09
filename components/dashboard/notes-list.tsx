import { StickyNote } from 'lucide-react'
import type { Note } from '@/lib/types'
import { DeleteNoteButton } from './delete-note-button'
import { LocalTime } from '@/components/local-time'

export function NotesList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
        <StickyNote className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">No notes yet</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Add your first one above. Only you can see what you write here.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
      {notes.map((note) => (
        <li key={note.id} className="flex items-start justify-between gap-4 p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="whitespace-pre-wrap break-words leading-relaxed">{note.content}</p>
            <LocalTime iso={note.created_at} className="font-mono text-xs text-muted-foreground" />
          </div>
          <DeleteNoteButton id={note.id} />
        </li>
      ))}
    </ul>
  )
}
