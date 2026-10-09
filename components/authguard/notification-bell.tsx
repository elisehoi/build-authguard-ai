'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'
import { markAllAlertsRead } from '@/app/authguard/(console)/actions'
import { LocalTime } from '@/components/local-time'
import type { UnreadNotification } from '@/lib/services/console-data'
import { cn } from '@/lib/utils'

export function NotificationBell({ count, items }: { count: number; items: UnreadNotification[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [marking, startMarking] = useTransition()

  // Close on navigation, Escape, or a click outside.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    const onPointer = (event: PointerEvent) => !rootRef.current?.contains(event.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const label = count === 0 ? 'Notifications, none unread' : `Notifications, ${count} unread`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell className="size-4" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] font-semibold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <p className="text-sm font-medium">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                disabled={marking}
                onClick={() => startMarking(() => markAllAlertsRead())}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-60"
              >
                {marking && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No unread alerts.</p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {items.map((item) => (
                <li key={item.alertId}>
                  <Link href={`/authguard/alerts/${item.alertId}`} className="flex flex-col gap-1 px-4 py-3 text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn('size-2 shrink-0 rounded-full', item.severity === 'high' ? 'bg-destructive' : 'bg-warning')}
                      />
                      <span className="font-medium">{item.title}</span>
                    </span>
                    <span className="pl-4 font-mono text-xs text-muted-foreground">
                      {item.severity} · <LocalTime iso={item.createdAt} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
