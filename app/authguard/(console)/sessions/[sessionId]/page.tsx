import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ClaimCard } from '@/components/authguard/claim-card'
import { EventsTable } from '@/components/authguard/events-table'
import { Explain } from '@/components/authguard/explain'
import { LocalTime } from '@/components/local-time'
import { ownsDemoApp } from '@/lib/services/console-access'
import { loadSession } from '@/lib/services/console-data'

const text = (value: unknown) => (typeof value === 'string' ? value : 'unknown')
const when = (value: unknown) => (typeof value === 'number' ? new Date(value * 1000).toISOString() : null)

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  // Next.js has already decoded the segment; decoding again would break on '%'.
  const { sessionId } = await params
  // The layout shows the empty state instead; pages may still render in parallel.
  if (!(await ownsDemoApp())) return null
  const events = await loadSession(sessionId)
  if (events.length === 0) notFound()

  const seen = events.filter((event) => event.event_type === 'session_seen').at(-1)
  const payload = (seen?.payload ?? {}) as Record<string, unknown>
  const issued = when(payload.iat)
  const expires = when(payload.exp)

  return (
    <>
      <Link href="/authguard" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All alerts
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Session {sessionId.slice(0, 8)}</h1>
        <p className="text-muted-foreground">{events.length} events in the last 7 days.</p>
      </header>

      {seen ? (
        <section aria-labelledby="claims" className="flex flex-col gap-3">
          <h2 id="claims" className="text-lg font-semibold">Session <Explain term="jwt">claims</Explain></h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            Read from the last session_seen event: the claims inside the user&apos;s <Explain term="access-token">access token</Explain>,
            which travels in the <Explain term="session-cookie">session cookie</Explain>. Names and values only; no token is ever
            stored. The same session id on another device is <Explain term="session-reuse">session reuse</Explain>.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <ClaimCard sessionId={sessionId} field="sub" title="Subject">{seen.user_ref ? `${seen.user_ref.slice(0, 8)}…` : 'unknown'}</ClaimCard>
            <ClaimCard sessionId={sessionId} field="role" title="Role">{text(payload.role)}</ClaimCard>
            <ClaimCard sessionId={sessionId} field="aal" title="Assurance level">{text(payload.aal)}</ClaimCard>
            <ClaimCard sessionId={sessionId} field="session_id" title="Session id">{`${sessionId.slice(0, 8)}…`}</ClaimCard>
            <ClaimCard sessionId={sessionId} field="iat" title="Issued at">
              {issued ? <LocalTime iso={issued} /> : 'unknown'}
            </ClaimCard>
            <ClaimCard sessionId={sessionId} field="exp" title="Expires at">
              {expires ? <LocalTime iso={expires} /> : 'unknown'}
            </ClaimCard>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No session_seen event yet, so there are no claims to show.
        </p>
      )}

      <section aria-labelledby="timeline" className="flex flex-col gap-3">
        <h2 id="timeline" className="text-lg font-semibold">Timeline</h2>
        <EventsTable events={events} />
      </section>
    </>
  )
}
