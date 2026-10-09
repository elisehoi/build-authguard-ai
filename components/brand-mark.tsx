import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function BrandMark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </span>
      <span>
        AuthGuard <span className="font-mono text-primary">AI</span>
      </span>
    </Link>
  )
}
