import type { Metadata } from 'next'
import { PageHeading } from '@/components/app/page-heading'
import { ReplayLab } from '@/components/demo/replay-lab'
import { loadProtectedPage } from '@/lib/services/protected-page'
import { getAuthCookieName } from '@/lib/supabase/cookie-name'

export const metadata: Metadata = { title: 'Stolen token replay' }

export default async function DemoPage() {
  await loadProtectedPage('/demo')

  return (
    <>
      <PageHeading eyebrow="Attack lab" title="What can a stolen token do?">
        Paste your own access token to play the attacker. You&apos;ll see that a copied token works until it expires,
        and that editing it breaks the signature. The token is used once in memory and never stored.
      </PageHeading>
      <ReplayLab cookieName={getAuthCookieName()} />
    </>
  )
}
