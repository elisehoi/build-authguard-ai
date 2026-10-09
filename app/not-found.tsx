import { ButtonLink } from '@/components/button-link'

// Neutral fallback for addresses outside both products.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">There&apos;s nothing at this address.</h1>
      <p className="leading-relaxed text-muted-foreground">The link may be old, or the page was moved.</p>
      <ButtonLink href="/" variant="outline">Go to the home page</ButtonLink>
    </main>
  )
}
