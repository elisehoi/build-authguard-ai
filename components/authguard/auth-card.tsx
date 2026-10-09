import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

// Frame for AuthGuard's own login and signup pages.
export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-1">
          <Link href="/" className="mb-2 flex w-fit items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            AuthGuard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children}
      </main>
    </div>
  )
}
