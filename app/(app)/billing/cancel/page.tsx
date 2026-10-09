import type { Metadata } from 'next'
import { ButtonLink } from '@/components/button-link'
import { PageHeading } from '@/components/app/page-heading'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'Checkout cancelled' }

export default async function BillingCancelPage() {
  await loadProtectedPage('/billing/cancel')
  return (
    <>
      <PageHeading eyebrow="Billing" title="Checkout cancelled">
        No payment was taken. You can upgrade any time.
      </PageHeading>
      <ButtonLink href="/billing" className="self-start">Back to billing</ButtonLink>
    </>
  )
}
