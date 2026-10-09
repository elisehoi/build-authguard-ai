import Link from 'next/link'
import { Hammer } from 'lucide-react'
import { WERKSTATT_HOME } from '@/lib/routes'

export function BrandMark({ href = WERKSTATT_HOME }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Hammer className="size-4" aria-hidden="true" />
      </span>
      Werkstatt
    </Link>
  )
}
