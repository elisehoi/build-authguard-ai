import { BrandMark } from '@/components/brand-mark'
import { ButtonLink } from '@/components/button-link'
import { WERKSTATT_HOME } from '@/lib/routes'

export default function WerkstattNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <BrandMark />
      <p className="font-mono text-xs text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">There&apos;s nothing at this address.</h1>
      <p className="leading-relaxed text-muted-foreground">The link may be old, or the page was moved.</p>
      <ButtonLink href={WERKSTATT_HOME}>Back to Werkstatt</ButtonLink>
    </main>
  )
}
