import { after } from 'next/server'
import { cookies } from 'next/headers'
import { AccountHeader } from '@/components/account/account-header'
import { getAuthGuard, snapshotRequest } from '@/lib/authguard'
import { getAuthContext, getVerifiedClaims } from '@/lib/services/auth-context'
import { redirect } from 'next/navigation'

// Supabase stores the session in cookies named sb-<ref>-auth-token (maybe chunked).
async function hasAuthCookie(): Promise<boolean> {
  return (await cookies()).getAll().some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'))
}

// Verify with the Supabase Auth server, then report to AuthGuard through the
// SDK only. A cookie that fails verification is reported as token_invalid.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [context, cookiePresent, guard, request] = await Promise.all([
    getAuthContext(),
    hasAuthCookie(),
    getAuthGuard(),
    snapshotRequest(),
  ])

  if (!context) {
    if (guard && cookiePresent) after(() => guard.tokenInvalid({ request }))
    redirect('/login?next=%2Faccount')
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
