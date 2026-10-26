import { after } from 'next/server'
import { AccountHeader } from '@/components/account/account-header'
import { getAuthGuard, snapshotRequest } from '@/lib/authguard'
import { WERKSTATT_ACCOUNT } from '@/lib/routes'
import { getVerifiedClaims, requireAuthContext } from '@/lib/werkstatt/auth-context'

// Verify with the Supabase Auth server, then report to AuthGuard through the
// SDK only. A cookie that fails verification is reported as token_invalid
// by the proxy, which redirects before this layout runs.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Redirects to the login page when signed out, or when the database is asleep.
  const [context, guard, request] = await Promise.all([requireAuthContext(WERKSTATT_ACCOUNT), getAuthGuard(), snapshotRequest()])

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
