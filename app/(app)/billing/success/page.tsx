import type { Metadata } from 'next'
import { ButtonLink } from '@/components/button-link'
import { PageHeading } from '@/components/app/page-heading'
import { ProfilesRepository } from '@/lib/repositories/profiles-repository'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'Payment received' }

// This page grants nothing. It only reads is_pro, which the webhook sets.
export default async function BillingSuccessPage() {
  const { supabase, user } = await loadProtectedPage('/billing/success')
  const profile = await new ProfilesRepository(supabase).findById(user.id)
  const isPro = profile?.is_pro ?? false

  return (
    <>
      <PageHeading eyebrow="Billing" title={isPro ? 'Pro is active' : 'Payment received'}>
        {isPro
          ? 'The Stripe webhook confirmed your payment and upgraded your account.'
          : 'We’re waiting for Stripe’s signed webhook to confirm it. This usually takes a few seconds. Refresh to check again.'}
      </PageHeading>
      <div className="flex gap-2">
        <ButtonLink href="/incidents">Go to Incidents</ButtonLink>
        {!isPro && (
          <ButtonLink href="/billing/success" variant="outline">Refresh</ButtonLink>
        )}
      </div>
    </>
  )
}
