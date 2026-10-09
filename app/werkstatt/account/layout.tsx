import { after } from 'next/server'
import { AccountHeader } from '@/components/account/account-header'
import { getAuthGuard, snapshotRequest } from '@/lib/authguard'
import { getAuthContext, getVerifiedClaims } from '@/lib/services/auth-context'
import { redirect } from 'next/navigation'
import { WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'

// Verify with the Supabase Auth server, then report to AuthGuard through the
// SDK only. A cookie that fails verification is reported as token_invalid
// by the proxy, which redirects before this layout runs.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [context, guard, request] = await Promise.all([
    getAuthContext(),
    getAuthGuard(),
    snapshotRequest(),
  ])

  if (!context) {
    redirect(`${WERKSTATT_LOGIN}?next=${encodeURIComponent(WERKSTATT_ACCOUNT)}`)
  }

  if (guard) {
    const claims = await getVerifiedClaims(context)
    if (claims) after(() => guard.sessionSeen({ claims, request }))
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AccountHeader email={context.user.email ?? 'Signed in'} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  )
}
