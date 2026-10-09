import { BrandMark } from '@/components/brand-mark'

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 py-5 md:px-6">
        <BrandMark />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-16 md:pt-8">
        <section className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  )
}
