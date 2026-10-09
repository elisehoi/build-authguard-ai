import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ReplayResult, TamperResult } from '@/lib/services/replay-service'

function formatRemaining(seconds: number | null): string {
  if (seconds === null) return 'unknown'
  if (seconds <= 0) return 'already expired'
  const minutes = Math.floor(seconds / 60)
  return minutes > 0 ? `${minutes} min ${seconds % 60}s` : `${seconds}s`
}

export function ReplayResultView({ result }: { result: ReplayResult }) {
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-card p-4">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Replay rejected
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{result.reason}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/50 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          <XCircle className="size-4 text-destructive" aria-hidden="true" /> The stolen token worked
        </p>
        <Badge variant="outline" className="font-mono">
          valid for {formatRemaining(result.secondsRemaining)}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        With no cookies and no password, the token alone read {result.notesRead.length}{' '}
        {result.notesRead.length === 1 ? 'note' : 'notes'}
        {result.tokenOwnerMatchesYou ? ' from your account.' : ' from the token owner’s account.'} RLS still applied: it
        only saw that one user&apos;s rows. This attempt was logged as a{' '}
        <code className="font-mono text-foreground">token_replay</code> event, which the Incidents page flags.
      </p>
      {result.notesRead.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-md bg-muted p-3 text-sm">
          {result.notesRead.slice(0, 5).map((note) => (
            <li key={note.id} className="truncate">
              {note.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TamperResultView({ result }: { result: TamperResult }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <p className="flex items-center gap-2 font-medium">
        {result.accepted ? (
          <XCircle className="size-4 text-destructive" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
        )}
        {result.accepted ? 'Forged token accepted (this should never happen)' : 'Forged token rejected'}
      </p>
      <p className="font-mono text-sm">
        role: <span className="text-muted-foreground line-through">{result.originalRole}</span> →{' '}
        <span className="text-foreground">{result.forgedRole}</span>
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        We changed one claim and kept the old signature. The signature no longer matches the content, so Supabase
        refused it. Server said: <span className="font-mono text-foreground">{result.serverMessage}</span>
      </p>
    </div>
  )
}
