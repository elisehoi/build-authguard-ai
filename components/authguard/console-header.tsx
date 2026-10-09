'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'
import { logout } from '@/app/authguard/auth/actions'
import { Button } from '@/components/ui/button'
import type { UnreadNotification } from '@/lib/services/console-data'
import { cn } from '@/lib/utils'
import { NotificationBell } from './notification-bell'

const LINKS = [
  { href: '/authguard', label: 'Alerts and events', exact: true },
  { href: '/authguard/assistant', label: 'Assistant', exact: false },
] as const

type ConsoleHeaderProps = { email: string; notifications?: { count: number; items: UnreadNotification[] } }

export function ConsoleHeader({ email, notifications }: ConsoleHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/authguard" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            AuthGuard
          </Link>
          <nav aria-label="Console" className="flex gap-1">
            {LINKS.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    active && 'bg-secondary text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {notifications && <NotificationBell count={notifications.count} items={notifications.items} />}
          <span className="hidden max-w-56 truncate font-mono text-xs text-muted-foreground sm:block">{email}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
