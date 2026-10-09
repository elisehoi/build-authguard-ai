import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const FEATURES = [
  { href: '/session', title: 'Token Inspector', body: 'Decode your JWT and ask what each claim means.' },
  { href: '/assistant', title: 'AI Security Assistant', body: 'Ask questions answered from this app’s real facts.' },
  { href: '/demo', title: 'Stolen token replay', body: 'See what a copied cookie unlocks, and what it can’t.' },
  { href: '/incidents', title: 'Incidents', body: 'Detection rules flag suspicious session activity.' },
  { href: '/billing', title: 'Billing', body: 'Upgrade to Pro with Stripe test mode.' },
] as const

export function FeatureLinks() {
  return (
    <aside aria-labelledby="explore-heading" className="flex flex-col gap-3">
      <h2 id="explore-heading" className="text-sm font-medium text-muted-foreground">
        Continue the lab
      </h2>
      <ul className="flex flex-col gap-2">
        {FEATURES.map((feature) => (
          <li key={feature.href}>
            <Link
              href={feature.href}
              className="group flex items-start justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <span className="flex flex-col gap-1">
                <span className="font-medium">{feature.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{feature.body}</span>
              </span>
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
