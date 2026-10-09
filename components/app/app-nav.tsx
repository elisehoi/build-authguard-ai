'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Notes' },
  { href: '/session', label: 'Token Inspector' },
  { href: '/assistant', label: 'Assistant' },
  { href: '/demo', label: 'Replay demo' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/billing', label: 'Billing' },
] as const

export function AppNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="-mb-px flex gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors',
              active
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
