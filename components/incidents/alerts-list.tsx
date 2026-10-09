import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Alert, AlertSeverity } from '@/lib/detection/types'
import { cn } from '@/lib/utils'

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  high: 'border-destructive/50 text-destructive',
  medium: 'border-warning bg-warning/30 text-warning-foreground',
  low: 'text-muted-foreground',
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  return (
    <section aria-labelledby="alerts-heading" className="flex flex-col gap-3">
      <h2 id="alerts-heading" className="text-lg font-semibold">
        Alerts <span className="font-mono text-sm font-normal text-muted-foreground">({alerts.length})</span>
      </h2>
      {alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
          <ShieldCheck className="mt-0.5 size-5 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nothing suspicious. To trigger an alert, replay your token on the Replay demo page or enter a wrong password
            a few times.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert, index) => (
            <li key={`${alert.ruleId}-${alert.sessionId ?? index}`} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{alert.title}</p>
                <Badge variant="outline" className={cn('font-mono uppercase', SEVERITY_STYLE[alert.severity])}>
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{alert.summary}</p>
              <p className="font-mono text-xs text-muted-foreground">
                rule {alert.ruleId} · events {alert.evidence.map((item) => `#${item.eventId}`).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
