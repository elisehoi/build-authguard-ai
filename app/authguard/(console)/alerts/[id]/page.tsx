import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AlertAiPanel } from '@/components/authguard/alert-ai-panel'
import { Explain } from '@/components/authguard/explain'
import { ExplainText } from '@/components/authguard/explain-text'
import { SeverityBadge } from '@/components/authguard/severity-badge'
import { LocalTime } from '@/components/local-time'
import { RULE_TERMS } from '@/lib/authguard/glossary'
import { ownsDemoApp } from '@/lib/services/console-access'
import { loadSnapshot } from '@/lib/services/console-data'

export default async function AlertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // The layout shows the empty state instead; pages may still render in parallel.
  if (!(await ownsDemoApp())) return null
  const { alerts } = await loadSnapshot()
  const alert = alerts.find((item) => item.id === id)
  if (!alert) notFound()

  return (
    <>
      <Link href="/authguard" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All alerts
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{alert.title}</h1>
        </div>
        <p className="max-w-prose leading-relaxed"><ExplainText text={alert.summary} /></p>
        <p className="flex flex-wrap gap-x-4 font-mono text-xs text-muted-foreground">
          <span>rule: {RULE_TERMS[alert.ruleId] ? <Explain term={RULE_TERMS[alert.ruleId]}>{alert.ruleId}</Explain> : alert.ruleId}</span>
          <span>{alert.subject}</span>
          <LocalTime iso={alert.occurredAt} />
          {alert.sessionId && (
            <Link href={`/authguard/sessions/${encodeURIComponent(alert.sessionId)}`} className="text-primary underline-offset-4 hover:underline">
              open session
            </Link>
          )}
        </p>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground"><ExplainText text={alert.ruleDescription} /></p>
      </header>

      <section aria-labelledby="evidence" className="flex flex-col gap-3">
        <h2 id="evidence" className="text-lg font-semibold">Evidence</h2>
        <ul className="flex flex-col gap-2">
          {alert.evidence.map((item) => (
            <li key={item.eventId} className="flex flex-col gap-1 rounded-lg border bg-card p-3 font-mono text-xs">
              <span className="flex flex-wrap gap-x-3">
                <span className="text-primary">{item.eventType}</span>
                <LocalTime iso={item.occurredAt} />
                <span className="text-muted-foreground">id {item.eventId.slice(0, 8)}</span>
                {item.ipHashPrefix && <span className="text-muted-foreground"><Explain term="ip-hash">ip</Explain> {item.ipHashPrefix}</span>}
              </span>
              {Object.keys(item.details).length > 0 && (
                <span className="break-all text-muted-foreground">{JSON.stringify(item.details)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <AlertAiPanel alertId={alert.id} />
    </>
  )
}
