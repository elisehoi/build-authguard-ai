import { LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'

export function AccountHeader({ email }: { email: string }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <BrandMark />
        <div className="flex items-center gap-3">
          <span className="hidden max-w-56 truncate text-sm text-muted-foreground sm:block">{email}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
