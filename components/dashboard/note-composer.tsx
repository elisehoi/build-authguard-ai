'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { addNote, type NoteActionState } from '@/app/account/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState: NoteActionState = { status: 'idle' }

export function NoteComposer() {
  const [state, action, pending] = useActionState(addNote, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'ok') formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <Label htmlFor="content">New note</Label>
      <Textarea
        id="content"
        name="content"
        maxLength={500}
        rows={3}
        placeholder="Dovetail layout, finish recipe, next class…"
        aria-invalid={state.status === 'error'}
        aria-describedby={state.status === 'error' ? 'content-error' : undefined}
        required
      />
      <div className="flex items-center justify-between gap-3">
        {state.status === 'error' ? (
          <p id="content-error" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Up to 500 characters.</p>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Add note
        </Button>
      </div>
    </form>
  )
}
