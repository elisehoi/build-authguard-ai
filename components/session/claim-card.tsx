'use client'

import { useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useExplain, type ExplainField, type ExplainLevel } from './use-explain'

type ClaimCardProps = {
  field: ExplainField
  label: string
  title: string
  hint: string
  level: ExplainLevel
  emphasis?: boolean
  children: React.ReactNode
}

export function ClaimCard({ field, label, title, hint, level, emphasis, children }: ClaimCardProps) {
  const { state, explain, reset } = useExplain(field)

  // A new level means the old explanation no longer matches the toggle.
  useEffect(() => reset(), [level, reset])

  const panelId = `explain-${field}`

  return (
    <article className={cn('flex flex-col gap-3 rounded-lg border bg-card p-4', emphasis && 'border-warning/60')}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-primary">{label}</span>
          <h2 className="font-medium">{title}</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => explain(level)}
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
      <div className="font-mono text-sm">{children}</div>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <div id={panelId} aria-live="polite">
        {state.status === 'done' && (
          <div className="rounded-md bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
            <p className="mb-1 font-mono text-xs">AI explanation · {level}</p>
            <p className="whitespace-pre-wrap">{state.text}</p>
          </div>
        )}
        {state.status === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </article>
  )
}
