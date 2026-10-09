import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/button-link'
import { ConsoleHeader } from '@/components/authguard/console-header'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN, WERKSTATT_ACCOUNT } from '@/lib/routes'
import { getConsoleAccess } from '@/lib/services/console-access'

export const metadata: Metadata = { title: { default: 'AuthGuard console', template: '%s · AuthGuard' }, robots: { index: false } }

// Two checks: a valid Supabase login, then the verified email on the admin list.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const access = await getConsoleAccess()
  if (access.status === 'anonymous') redirect(`${AUTHGUARD_LOGIN}?next=${encodeURIComponent(AUTHGUARD_HOME)}`)

  if (access.status === 'forbidden') {
    return (
      <div className="console flex min-h-dvh items-center justify-center px-4">
        <main className="flex max-w-md flex-col items-start gap-4">
          <p className="font-mono text-xs text-destructive">403</p>
          <h1 className="text-2xl font-semibold tracking-tight">This account can&apos;t open the console.</h1>
          <p className="leading-relaxed text-muted-foreground">
            The AuthGuard console is limited to administrators with a confirmed email address.
          </p>
          <ButtonLink href={WERKSTATT_ACCOUNT} variant="outline">Back to my notes</ButtonLink>
        </main>
      </div>
    )
  }

  return (
    <div className="console flex min-h-dvh flex-col">
      <ConsoleHeader email={access.email} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
