import { ShieldCheck } from 'lucide-react'
import { ButtonLink } from '@/components/button-link'
import { AUTHGUARD_HOME } from '@/lib/routes'

export default function AuthGuardNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <p className="flex items-center gap-2 font-semibold tracking-tight">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        AuthGuard
      </p>
      <p className="font-mono text-xs text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page doesn&apos;t exist.</h1>
      <p className="leading-relaxed text-muted-foreground">
        Alerts are kept for 7 days, so an older alert or session link no longer opens.
      </p>
      <ButtonLink href={AUTHGUARD_HOME}>Back to the console</ButtonLink>
    </main>
  )
}
