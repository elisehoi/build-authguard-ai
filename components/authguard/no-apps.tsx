import { PlugZap } from 'lucide-react'
import { ButtonLink } from '@/components/button-link'
import { WERKSTATT_HOME } from '@/lib/routes'

// Shown to every signed-in account that does not own a connected app.
export function NoAppsConnected() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-lg border bg-card p-8 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
        <PlugZap className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">No apps connected yet</h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          Apps connect to AuthGuard through the AuthGuard SDK and an API key provided by the AuthGuard team. Nothing
          appears here until a connected app sends its first event.
        </p>
      </div>
      <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>The AuthGuard team gives your app an app id and an API key.</li>
        <li>You add the AuthGuard SDK to your login, signup and session code. It sends events such as logins and failed attempts, never passwords or raw IP addresses.</li>
        <li>AuthGuard runs its detection rules on those events and shows alerts here, each with a plain-language explanation.</li>
      </ol>
      <ButtonLink href={WERKSTATT_HOME} variant="outline">See a connected demo app</ButtonLink>
    </section>
  )
}
