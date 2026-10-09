'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export function ExpiryCountdown({ exp }: { exp: number }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (now === null) return <span className="text-xs text-muted-foreground">calculating…</span>

  const remaining = exp - now
  if (remaining <= 0) {
    return (
      <span className="text-xs text-destructive">
        Expired. Reload: the proxy will use the refresh token to get a new one.
      </span>
    )
  }

  return (
    <span className={cn('text-xs', remaining < 300 ? 'text-destructive' : 'text-warning-foreground')}>
      <span className="rounded bg-warning/40 px-1.5 py-0.5 font-medium tabular-nums">{format(remaining)}</span> left
    </span>
  )
}
