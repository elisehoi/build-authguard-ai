import { ButtonLink } from '@/components/button-link'
import { BrandMark } from '@/components/brand-mark'
import { LandingTokenAnatomy } from '@/components/landing/token-anatomy'
import { LandingLessons } from '@/components/landing/lessons'
import { getAuthContext } from '@/lib/services/auth-context'

export default async function HomePage() {
  const context = await getAuthContext()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <BrandMark />
          <nav aria-label="Account" className="flex items-center gap-2">
            {context ? (
              <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
                <ButtonLink href="/signup">Create account</ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-sm text-primary">An auth lab you can poke at</p>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              See exactly what happens after you click &ldquo;Log in&rdquo;.
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              AuthGuard AI lets you sign in, open up your own session token, and replay it like an attacker would.
              Deterministic code does every security check. The AI only explains what you&apos;re looking at, in plain
              language.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={context ? '/session' : '/signup'} size="lg">{context ? 'Inspect my token' : 'Start the lab'}</ButtonLink>
              {!context && (
                <ButtonLink href="/login" size="lg" variant="outline">I already have an account</ButtonLink>
              )}
            </div>
          </div>
          <LandingTokenAnatomy />
        </section>

        <LandingLessons />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-relaxed text-muted-foreground md:px-6">
          Educational project. Stripe runs in test mode. Never paste a real production token anywhere you don&apos;t
          control.
        </div>
      </footer>
    </div>
  )
}
