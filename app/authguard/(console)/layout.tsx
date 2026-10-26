import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ConsoleHeader } from '@/components/authguard/console-header'
import { NoAppsConnected } from '@/components/authguard/no-apps'
import { withAuthError } from '@/lib/auth/messages'
import { AUTHGUARD_HOME, AUTHGUARD_LOGIN } from '@/lib/routes'
import { getConsoleAccess } from '@/lib/services/console-access'
import { loadUnreadNotifications } from '@/lib/services/console-data'

export const metadata: Metadata = { title: { default: 'AuthGuard console', template: '%s · AuthGuard' }, robots: { index: false } }

// Any signed-in account may open the console. Accounts without a connected
// app see the empty state; pages also check ownership before loading data.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const access = await getConsoleAccess()
  if (access.status === 'unavailable') redirect(withAuthError(AUTHGUARD_LOGIN, 'unavailable', AUTHGUARD_HOME))
  if (access.status === 'anonymous') redirect(`${AUTHGUARD_LOGIN}?next=${encodeURIComponent(AUTHGUARD_HOME)}`)

  // A missing notifications table must not take the console down.
  const notifications = access.ownsDemoApp
    ? await loadUnreadNotifications().catch((error) => {
        console.error(`[notifications] ${(error as Error).message}`)
        return { count: 0, items: [] }
      })
    : undefined

  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <ConsoleHeader email={access.email} demoMode={access.demoMode} notifications={notifications} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
        {access.ownsDemoApp ? children : <NoAppsConnected />}
      </main>
    </div>
  )
}
