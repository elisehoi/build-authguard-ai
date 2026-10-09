import { AlertsList } from '@/components/authguard/alerts-list'
import { EventsTable } from '@/components/authguard/events-table'
import { ownsDemoApp } from '@/lib/services/console-access'
import { loadSnapshot } from '@/lib/services/console-data'

export default async function ConsolePage() {
  // The layout shows the empty state instead; pages may still render in parallel.
  if (!(await ownsDemoApp())) return null
  const { events, alerts } = await loadSnapshot()
  const counts = {
    high: alerts.filter((alert) => alert.severity === 'high').length,
    medium: alerts.filter((alert) => alert.severity === 'medium').length,
    low: alerts.filter((alert) => alert.severity === 'low').length,
  }
  const stats = [
    { label: 'Events, last 7 days', value: events.length, tone: 'text-foreground' },
    { label: 'High alerts', value: counts.high, tone: 'text-destructive' },
    { label: 'Medium alerts', value: counts.medium, tone: 'text-warning' },
    { label: 'Low alerts', value: counts.low, tone: 'text-primary' },
  ]

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alerts and events</h1>
        <p className="text-muted-foreground">Computed from events sent by monitored apps. Each alert comes from a fixed rule.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className={`mt-1 font-mono text-3xl font-semibold ${stat.tone}`}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="alerts" className="flex flex-col gap-3">
        <h2 id="alerts" className="text-lg font-semibold">Alerts</h2>
        <AlertsList alerts={alerts} />
      </section>

      <section aria-labelledby="events" className="flex flex-col gap-3">
        <h2 id="events" className="text-lg font-semibold">Latest events</h2>
        <EventsTable events={[...events].reverse().slice(0, 50)} />
      </section>
    </>
  )
}
