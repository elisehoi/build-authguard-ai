import { AppHeader } from '@/components/app/app-header'
import { requireAuthContext } from '@/lib/services/auth-context'

// The proxy already redirects logged-out visitors, but the layout checks again
// with getUser(): defence in depth, because a proxy can be misconfigured.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuthContext('/dashboard')

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email ?? 'Signed in'} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  )
}
