'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AUTHGUARD_HOME } from '@/lib/routes'
import { ownsDemoApp } from '@/lib/services/console-access'
import { markNotificationRead } from '@/lib/services/console-data'

const alertIdSchema = z.string().regex(/^[0-9a-f]{16}$/)

// Called when an alert page opens. Revalidating the console layout refreshes
// the bell count and the "New" badges.
export async function markAlertRead(alertId: string): Promise<void> {
  const parsed = alertIdSchema.safeParse(alertId)
  if (!parsed.success || !(await ownsDemoApp())) return
  await markNotificationRead(parsed.data)
  revalidatePath(AUTHGUARD_HOME, 'layout')
}
