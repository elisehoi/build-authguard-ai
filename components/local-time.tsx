'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// Renders in the visitor's own timezone. The server snapshot uses UTC so the
// first HTML is stable and hydration does not mismatch.
export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString(),
    () => new Date(iso).toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
  )
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  )
}
