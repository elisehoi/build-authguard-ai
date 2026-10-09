'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExplainableField } from '@/lib/services/explain-service'
import { useExplain } from './use-explain'

type ClaimCardProps = {
  sessionId: string
  field: ExplainableField
  title: string
  children: React.ReactNode
}

export function ClaimCard({ sessionId, field, title, children }: ClaimCardProps) {
  const { state, explain } = useExplain(sessionId, field)
  const panelId = `explain-${field}`

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-primary">{field}</span>
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={explain}
          disabled={state.status === 'loading'}
          aria-expanded={state.status === 'done'}
          aria-controls={panelId}
        >
          {state.status === 'loading' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          Explain
        </Button>
      </header>
      <div className="font-mono text-sm break-all">{children}</div>
      <div id={panelId} aria-live="polite">
        {state.status === 'done' && (
          <div className="rounded-md bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
            <p className="mb-1 font-mono text-xs">AI explanation</p>
            <p className="whitespace-pre-wrap">{state.text}</p>
          </div>
        )}
        {state.status === 'error' && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      </div>
    </article>
  )
}
