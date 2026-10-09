'use client'

import { useEffect } from 'react'
import { markAlertRead } from '@/app/authguard/(console)/actions'

// Marks the alert's notification read once the page is open in the browser.
export function MarkRead({ alertId }: { alertId: string }) {
  useEffect(() => {
    void markAlertRead(alertId)
  }, [alertId])
  return null
}
