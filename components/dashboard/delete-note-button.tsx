'use client'

import { useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteNote } from '@/app/werkstatt/account/actions'
import { Button } from '@/components/ui/button'

export function DeleteNoteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Delete note"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteNote(id)
          if (result.status === 'error') toast.error(result.message)
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
    </Button>
  )
}
