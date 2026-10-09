'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { WERKSTATT_ACCOUNT } from '@/lib/routes'
import { NotesRepository } from '@/lib/repositories/notes-repository'
import { getAuthContext } from '@/lib/services/auth-context'

export type NoteActionState = { status: 'idle' } | { status: 'ok' } | { status: 'error'; message: string }

const contentSchema = z.string().trim().min(1, 'Write something first.').max(500, 'Notes are limited to 500 characters.')
const idSchema = z.uuid()

// Notes use the user's own Supabase client, so RLS enforces ownership in the
// database. No user_id is sent: it defaults to auth.uid().
export async function addNote(_prev: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const context = await getAuthContext()
  if (!context) return { status: 'error', message: 'Your session expired. Please log in again.' }

  const parsed = contentSchema.safeParse(formData.get('content'))
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid note.' }

  try {
    await new NotesRepository(context.supabase).create(parsed.data)
  } catch {
    return { status: 'error', message: 'The note could not be saved. Please try again.' }
  }
  revalidatePath(WERKSTATT_ACCOUNT)
  return { status: 'ok' }
}

export async function deleteNote(id: string): Promise<NoteActionState> {
  const context = await getAuthContext()
  if (!context) return { status: 'error', message: 'Your session expired. Please log in again.' }

  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return { status: 'error', message: 'Invalid note id.' }

  try {
    await new NotesRepository(context.supabase).delete(parsed.data)
  } catch {
    return { status: 'error', message: 'The note could not be deleted. Please try again.' }
  }
  revalidatePath(WERKSTATT_ACCOUNT)
  return { status: 'ok' }
}
