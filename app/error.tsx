'use client'

import { Button } from '@/components/ui/button'

// Neutral fallback for errors outside both products' own error pages. Only a
// generic message and the digest are shown: error.message can contain server
// details that should not reach the browser.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">This page couldn&apos;t load.</h1>
      <p className="leading-relaxed text-muted-foreground">Something went wrong on our side. Please try again in a moment.</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
