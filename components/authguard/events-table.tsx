import Link from 'next/link'
import { LocalTime } from '@/components/local-time'
import { EVENT_TERMS } from '@/lib/authguard/glossary'
import type { AuthGuardEvent } from '@/lib/types'
import { Explain } from './explain'

function shortAgent(agent: string | null): string {
  if (!agent) return 'unknown'
  const browser = /(Edg|Chrome|Firefox|Safari)\//.exec(agent)?.[1]
  const os = /(Windows|Mac OS X|Android|iPhone|Linux)/.exec(agent)?.[1]
  return [browser === 'Edg' ? 'Edge' : browser, os].filter(Boolean).join(' · ') || agent.slice(0, 24)
}

export function EventsTable({ events }: { events: AuthGuardEvent[] }) {
  if (events.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No events received yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-176 text-left text-sm">
        <caption className="sr-only">Events received from monitored apps</caption>
        <thead className="border-b bg-muted/50 font-mono text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Time</th>
            <th scope="col" className="px-3 py-2 font-medium"><Explain term="auth-event">Event</Explain></th>
            <th scope="col" className="px-3 py-2 font-medium"><Explain term="session-id">Session</Explain></th>
            <th scope="col" className="px-3 py-2 font-medium"><Explain term="user-ref">User ref</Explain></th>
            <th scope="col" className="px-3 py-2 font-medium"><Explain term="user-agent">Client</Explain></th>
            <th scope="col" className="px-3 py-2 font-medium"><Explain term="ip-hash">IP hash</Explain></th>
          </tr>
        </thead>
        <tbody className="divide-y font-mono text-xs">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-3 py-2 whitespace-nowrap"><LocalTime iso={event.occurred_at} /></td>
              <td className="px-3 py-2">
                {EVENT_TERMS[event.event_type] ? <Explain term={EVENT_TERMS[event.event_type]}>{event.event_type}</Explain> : event.event_type}
              </td>
              <td className="px-3 py-2">
                {event.session_id ? (
                  <Link href={`/authguard/sessions/${encodeURIComponent(event.session_id)}`} className="text-primary underline-offset-4 hover:underline">
                    {event.session_id.slice(0, 8)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">none</span>
                )}
              </td>
              <td className="px-3 py-2">{event.user_ref?.slice(0, 8) ?? <span className="text-muted-foreground">none</span>}</td>
              <td className="px-3 py-2">{shortAgent(event.user_agent)}</td>
              <td className="px-3 py-2">{event.ip_hash?.slice(0, 8) ?? <span className="text-muted-foreground">none</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
