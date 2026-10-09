'use client'

import { useState } from 'react'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { postJson } from '@/lib/client/post-json'
import type { SecurityReport } from '@/lib/services/incident-service'
import { cn } from '@/lib/utils'

type Status<T> = { status: 'idle' } | { status: 'loading' } | { status: 'done'; value: T } | { status: 'error'; message: string }

function useAlertRequest<T>(url: string, alertId: string, pick: (data: never) => T) {
  const [state, setState] = useState<Status<T>>({ status: 'idle' })
  async function run() {
    setState({ status: 'loading' })
    const result = await postJson<never>(url, { alertId })
    setState(result.ok ? { status: 'done', value: pick(result.data) } : { status: 'error', message: result.message })
  }
  return [state, run] as const
}

const CONFIDENCE_STYLE = { low: 'text-warning', medium: 'text-primary', high: 'text-primary' } as const

export function AlertAiPanel({ alertId }: { alertId: string }) {
  const [explanation, explain] = useAlertRequest<string>('/api/authguard/explain-alert', alertId, (data: { explanation: string }) => data.explanation)
  const [report, generate] = useAlertRequest<SecurityReport>('/api/authguard/report', alertId, (data: { report: SecurityReport }) => data.report)

  return (
    <section aria-labelledby="ai-heading" className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="ai-heading" className="text-lg font-semibold">AI help</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The alert itself comes from a fixed rule. The AI only writes about the evidence above, and its output is not stored.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={explain} disabled={explanation.status === 'loading'}>
          {explanation.status === 'loading' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          Explain in plain language
        </Button>
        <Button onClick={generate} disabled={report.status === 'loading'}>
          {report.status === 'loading' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
          Generate security report
        </Button>
      </div>

      <div aria-live="polite" className="flex flex-col gap-4">
        {explanation.status === 'done' && (
          <div className="rounded-md bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
            <p className="mb-1 font-mono text-xs">AI explanation</p>
            <p className="whitespace-pre-wrap">{explanation.value}</p>
          </div>
        )}
        {explanation.status === 'error' && <p role="alert" className="text-sm text-destructive">{explanation.message}</p>}

        {report.status === 'done' && <ReportView report={report.value} />}
        {report.status === 'error' && <p role="alert" className="text-sm text-destructive">{report.message}</p>}
      </div>
    </section>
  )
}

function ReportView({ report }: { report: SecurityReport }) {
  return (
    <article className="flex flex-col gap-4 rounded-md border p-4 text-sm leading-relaxed">
      <p className="font-mono text-xs text-primary">AI-generated report · review before acting</p>
      <p className="text-base">{report.summary}</p>

      <div className="flex flex-col gap-2">
        <h3 className="font-medium">What happened</h3>
        <ul className="flex flex-col gap-2">
          {report.whatHappened.map((item) => (
            <li key={item.statement} className="flex flex-col gap-1">
              <span>{item.statement}</span>
              {item.eventIds.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {item.eventIds.map((id) => (
                    <code key={id} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{id.slice(0, 8)}</code>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-medium">Likely cause</h3>
        <p>
          {report.likelyCause.statement}{' '}
          <span className={cn('font-mono text-xs', CONFIDENCE_STYLE[report.likelyCause.confidence])}>
            confidence: {report.likelyCause.confidence}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-medium">Impact</h3>
        <p>{report.impact}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-medium">Recommended fixes</h3>
        <ul className="flex flex-col gap-2">
          {report.fixes.map((fix) => (
            <li key={fix.action}>
              {fix.action}{' '}
              <a href={fix.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                Learn more
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
