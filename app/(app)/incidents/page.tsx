import type { Metadata } from 'next'
import { PageHeading } from '@/components/app/page-heading'
import { AlertsList } from '@/components/incidents/alerts-list'
import { EventsTable } from '@/components/incidents/events-table'
import { IncidentReportPanel } from '@/components/incidents/incident-report-panel'
import { ProfilesRepository } from '@/lib/repositories/profiles-repository'
import { SessionEventsRepository } from '@/lib/repositories/session-events-repository'
import { IncidentService } from '@/lib/services/incident-service'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'Incidents' }

export default async function IncidentsPage() {
  const { supabase, user } = await loadProtectedPage('/incidents')

  const [alerts, events, profile] = await Promise.all([
    new IncidentService(supabase).detect(user.id),
    new SessionEventsRepository(supabase).listRecent(user.id),
    new ProfilesRepository(supabase).findById(user.id),
  ])

  return (
    <>
      <PageHeading eyebrow="Detection" title="Suspicious session activity">
        Three plain rules scan your recent auth events: a token replayed outside the browser, the same session on a new
        device, and bursts of failed logins. The rules decide what is suspicious. AI only writes up the findings.
      </PageHeading>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-8">
          <AlertsList alerts={alerts} />
          <EventsTable events={events.slice(0, 25)} />
        </div>
        <IncidentReportPanel isPro={profile?.is_pro ?? false} hasAlerts={alerts.length > 0} />
      </div>
    </>
  )
}
