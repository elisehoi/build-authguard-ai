'use client'

import { ButtonLink } from '@/components/button-link'
import { Button } from '@/components/ui/button'
import { AUTHGUARD_HOME } from '@/lib/routes'

// Only a generic message and the digest are shown: error.message can contain
// server details that should not reach the browser.
export default function AuthGuardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <p className="font-mono text-xs text-destructive">Something broke</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page couldn&apos;t load.</h1>
      <p className="leading-relaxed text-muted-foreground">It may be a temporary problem or a missing configuration value.</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href={AUTHGUARD_HOME} variant="outline">Back to the console</ButtonLink>
      </div>
    </main>
  )
}
