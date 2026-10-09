import { NextResponse } from 'next/server'
import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, routeError } from '@/lib/http'
import { ProfilesRepository } from '@/lib/repositories/profiles-repository'
import { getAuthContext } from '@/lib/services/auth-context'
import { IncidentService } from '@/lib/services/incident-service'

// No request body: the server loads the user's own events and alerts, so a
// client cannot feed invented evidence into the report.
export async function POST() {
  const context = await getAuthContext()
  if (!context) return jsonError(401, 'unauthenticated', 'Please sign in again.')

  try {
    // Pro is checked on the server. Hiding the button in the UI is not enough.
    const profile = await new ProfilesRepository(context.supabase).findById(context.user.id)
    if (!profile?.is_pro) return jsonError(403, 'pro_required', 'AI incident reports are a Pro feature.')

    const service = new IncidentService(context.supabase)
    const alerts = await service.detect(context.user.id)
    const report = await service.generateReport(alerts, getLLMClient())
    return NextResponse.json({ report })
  } catch (error) {
    return routeError(error, 'incidents/report')
  }
}
