import { LocalTime } from '@/components/local-time'
import type { SessionEvent } from '@/lib/types'

export function EventsTable({ events }: { events: SessionEvent[] }) {
  return (
    <section aria-labelledby="events-heading" className="flex flex-col gap-3">
      <h2 id="events-heading" className="text-lg font-semibold">
        Recent events
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">#</th>
                <th scope="col" className="px-4 py-2 font-medium">Event</th>
                <th scope="col" className="px-4 py-2 font-medium">Session</th>
                <th scope="col" className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-xs">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-2 text-muted-foreground">{event.id}</td>
                  <td className={event.event_type === 'token_replay' || event.event_type === 'login_failed' ? 'px-4 py-2 text-destructive' : 'px-4 py-2'}>
                    {event.event_type}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{event.session_id ? `${event.session_id.slice(0, 8)}…` : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                    <LocalTime iso={event.created_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
