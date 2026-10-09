import Link from 'next/link'
import { LocalTime } from '@/components/local-time'
import type { Alert } from '@/lib/detection/types'
import { SeverityBadge } from './severity-badge'

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">No alerts in the last 7 days.</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Alerts appear when the detection rules match events sent by the Werkstatt app, such as repeated failed logins.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <Link
            href={`/authguard/alerts/${alert.id}`}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <span className="font-medium">{alert.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{alert.summary}</p>
            <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
              <span>{alert.ruleId}</span>
              <span>{alert.subject}</span>
              <LocalTime iso={alert.occurredAt} />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
