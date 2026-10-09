import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { AUTHGUARD_HOME } from '@/lib/routes'
import { safeNextPath } from '@/lib/safe-redirect'
import { getAuthContext } from '@/lib/services/auth-context'

export const metadata: Metadata = { title: { absolute: 'Log in · AuthGuard' }, robots: { index: false } }

// Outside the (console) group, so the console layout's admin check does not
// run here. The admin check happens after login, when "next" is opened.
export default async function ConsoleLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  // Always pass a next, so a successful login lands in the console rather than
  // in the Werkstatt default.
  const next = safeNextPath(typeof params.next === 'string' ? params.next : undefined, AUTHGUARD_HOME)
  // Rendered as escaped text by React; length is capped.
  const urlError = typeof params.error === 'string' ? params.error.slice(0, 200) : undefined

  if (await getAuthContext()) redirect(next)

  return (
    <div className="console flex min-h-dvh items-center justify-center px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            AuthGuard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Console login</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Administrators only. Your email must be confirmed and on the admin list.
          </p>
        </div>
        <LoginForm next={next} urlError={urlError} />
      </main>
    </div>
  )
}
