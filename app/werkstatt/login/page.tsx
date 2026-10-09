import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AsideNote, AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { WERKSTATT_ACCOUNT } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getAuthContext } from '@/lib/services/auth-context'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? safeNextPath(params.next) : undefined
  // Error text comes from our own redirects; it is rendered as plain text by
  // React (escaped), so a crafted ?error= cannot inject HTML. Length is capped.
  const urlError = typeof params.error === 'string' ? params.error.slice(0, 200) : undefined

  if (await getAuthContext()) redirect(next ?? WERKSTATT_ACCOUNT)

  return (
    <AuthShell
      title="Log in"
      description="Use email and password, or let Google vouch for you."
      aside={
        <>
          <h2 className="text-lg font-semibold">What happens when you press the button</h2>
          <AsideNote label="1. Password check">
            Your password goes to Supabase over HTTPS and is compared with a bcrypt hash. Nobody stores the password
            itself.
          </AsideNote>
          <AsideNote label="2. Tokens issued">
            Supabase returns a short-lived access token (a signed JWT) and a long-lived refresh token.
          </AsideNote>
          <AsideNote label="3. Cookie set">
            The server stores both in a cookie named sb-…-auth-token. You can inspect the decoded token afterwards on
            the Session page.
          </AsideNote>
        </>
      }
    >
      <LoginForm next={next} urlError={urlError} />
    </AuthShell>
  )
}
