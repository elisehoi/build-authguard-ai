import Link from 'next/link'
import { LocalTime } from '@/components/local-time'
import { RULE_TERMS } from '@/lib/authguard/glossary'
import type { Alert } from '@/lib/detection/types'
import { Explain } from './explain'
import { ExplainText } from './explain-text'
import { SeverityBadge } from './severity-badge'

// Each card is clickable through a "stretched" title link (its ::after covers
// the card). The pop-up triggers inside sit above it (relative z-10), so
// hovering a term explains it and clicking the rest of the card opens the alert.
// A plain <Link> around the whole card cannot work: buttons inside links are invalid HTML.
export function AlertsList({ alerts, newIds = [] }: { alerts: Alert[]; newIds?: string[] }) {
  const unread = new Set(newIds)
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No alerts in the last 7 days.</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Alerts appear when the detection rules match events sent by the Werkstatt demo app, such as repeated failed logins.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="relative flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/60 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-ring"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <Link href={`/authguard/alerts/${alert.id}`} className="font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none">
              {alert.title}
            </Link>
            {unread.has(alert.id) && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">New</span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <ExplainText text={alert.summary} />
          </p>
          <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
            <span>{RULE_TERMS[alert.ruleId] ? <Explain term={RULE_TERMS[alert.ruleId]}>{alert.ruleId}</Explain> : alert.ruleId}</span>
            <span>
              <ExplainText text={alert.subject} />
            </span>
            <LocalTime iso={alert.occurredAt} />
          </p>
        </li>
      ))}
    </ul>
  )
}
