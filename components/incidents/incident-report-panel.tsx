'use client'

import { useState } from 'react'
import { ButtonLink } from '@/components/button-link'
import { FileText, Loader2, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { postJson } from '@/lib/client/post-json'
import type { IncidentReport } from '@/lib/services/incident-service'

export function IncidentReportPanel({ isPro, hasAlerts }: { isPro: boolean; hasAlerts: boolean }) {
  const [report, setReport] = useState<IncidentReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    const result = await postJson<{ report: IncidentReport }>('/api/incidents/report')
    setLoading(false)
    if (result.ok) setReport(result.data.report)
    else setError(result.message)
  }

  return (
    <aside aria-labelledby="report-heading" className="flex flex-col gap-4 self-start rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="report-heading" className="font-semibold">
          AI incident report
        </h2>
        <Badge variant="secondary">Pro</Badge>
      </div>

      {!isPro ? (
        <div className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Upgrade to get a written summary: likely cause, cited evidence, confidence and fixes.
          </p>
          <ButtonLink href="/billing">Upgrade to Pro</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button onClick={generate} disabled={loading || !hasAlerts}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
            {report ? 'Regenerate report' : 'Generate report'}
          </Button>
          {!hasAlerts && <p className="text-sm text-muted-foreground">No alerts to report on yet.</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {report && (
            <div className="flex flex-col gap-4 text-sm" aria-live="polite">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-muted-foreground">Likely cause</p>
                <p className="leading-relaxed">{report.likelyCause}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-muted-foreground">Confidence</p>
                <p className="capitalize">{report.confidence}</p>
              </div>
              {report.evidence.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-xs text-muted-foreground">Evidence</p>
                  <ul className="flex flex-col gap-1">
                    {report.evidence.map((item) => (
                      <li key={item.eventId} className="leading-relaxed">
                        <span className="font-mono">#{item.eventId}</span> {item.why}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs text-muted-foreground">Recommended fixes</p>
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  {report.fixes.map((fix) => (
                    <li key={fix} className="leading-relaxed">
                      {fix}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
