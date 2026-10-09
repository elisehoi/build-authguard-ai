import { LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { AppNav } from './app-nav'

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <BrandMark href="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate font-mono text-xs text-muted-foreground sm:inline">{email}</span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </Button>
            </form>
          </div>
        </div>
        <AppNav />
      </div>
    </header>
  )
}
