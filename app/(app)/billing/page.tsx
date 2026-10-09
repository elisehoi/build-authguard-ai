import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import { PageHeading } from '@/components/app/page-heading'
import { UpgradeButton } from '@/components/billing/upgrade-button'
import { getServerEnv } from '@/lib/env'
import { ProfilesRepository } from '@/lib/repositories/profiles-repository'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'Billing' }

const PRO_FEATURES = [
  'AI incident reports with cited evidence',
  'Confidence rating and recommended fixes',
  'One-time payment, Stripe test mode',
] as const

function checkoutConfigured(): boolean {
  try {
    getServerEnv('stripeCheckout')
    return true
  } catch {
    return false
  }
}

export default async function BillingPage() {
  const { supabase, user } = await loadProtectedPage('/billing')
  const profile = await new ProfilesRepository(supabase).findById(user.id)
  const isPro = profile?.is_pro ?? false

  return (
    <>
      <PageHeading eyebrow="Billing" title={isPro ? 'You’re on Pro' : 'Upgrade to Pro'}>
        Pro is only switched on by a signed Stripe webhook, never by the redirect back to this site. A user could
        visit the success URL directly, but they can&apos;t forge Stripe&apos;s signature.
      </PageHeading>

      <section className="flex max-w-md flex-col gap-5 rounded-lg border bg-card p-6" aria-labelledby="plan-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="plan-heading" className="text-lg font-semibold">
            AuthGuard Pro
          </h2>
          <span className="font-mono text-sm text-muted-foreground">test mode</span>
        </div>
        <ul className="flex flex-col gap-2">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm leading-relaxed">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        {isPro ? (
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">Pro is active on this account.</p>
        ) : checkoutConfigured() ? (
          <>
            <UpgradeButton />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use card 4242 4242 4242 4242, any future date and any CVC.
            </p>
          </>
        ) : (
          <p className="rounded-md border border-warning bg-warning/30 px-3 py-2 text-sm leading-relaxed text-warning-foreground">
            Checkout isn&apos;t configured yet. Connect Stripe so <code className="font-mono">STRIPE_SECRET_KEY</code> is
            available.
          </p>
        )}
      </section>
    </>
  )
}
