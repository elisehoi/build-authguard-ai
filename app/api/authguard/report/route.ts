import { z } from 'zod'
import { getLLMClient } from '@/lib/ai/vercel-ai-client'
import { jsonError, parseJsonBody, routeError } from '@/lib/http'
import { loadSnapshot } from '@/lib/services/console-data'
import { denyUnlessAdmin } from '@/lib/services/console-api'
import { AlertAiService } from '@/lib/services/incident-service'

const schema = z.object({ alertId: z.string().min(1).max(64) })

export async function POST(request: Request) {
  const denied = await denyUnlessAdmin()
  if (denied) return denied

  const body = await parseJsonBody(request, schema)
  if (!body.ok) return body.response

  try {
    const { alerts } = await loadSnapshot()
    const alert = alerts.find((item) => item.id === body.data.alertId)
    if (!alert) return jsonError(404, 'not_found', 'That alert is no longer in the last 7 days of events.')
    const report = await new AlertAiService(getLLMClient()).generateReport(alert)
    return Response.json({ report })
  } catch (error) {
    return routeError(error, 'report')
  }
}
