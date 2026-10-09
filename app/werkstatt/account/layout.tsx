import { after } from 'next/server'
import { cookies } from 'next/headers'
import { AccountHeader } from '@/components/account/account-header'
import { getAuthGuard, snapshotRequest } from '@/lib/authguard'
import { getAuthContext, getVerifiedClaims } from '@/lib/services/auth-context'
import { redirect } from 'next/navigation'
import { WERKSTATT_ACCOUNT, WERKSTATT_LOGIN } from '@/lib/routes'
import { WERKSTATT_AUTH_COOKIE } from '@/lib/supabase/werkstatt/config'

// Werkstatt's session cookie (maybe chunked as <name>.0, <name>.1, ...).
async function hasAuthCookie(): Promise<boolean> {
  return (await cookies()).getAll().some((cookie) => cookie.name === WERKSTATT_AUTH_COOKIE || cookie.name.startsWith(`${WERKSTATT_AUTH_COOKIE}.`))
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
