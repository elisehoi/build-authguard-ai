import { BrandMark } from '@/components/brand-mark'

export function AuthShell({
  title,
  description,
  aside,
  children,
}: {
  title: string
  description: string
  aside: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 py-5 md:px-6">
        <BrandMark />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 pb-16 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start md:px-6 md:pt-8">
        <section className="order-2 flex flex-col gap-3 md:order-1 md:pr-8">{aside}</section>
        <section className="order-1 flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm md:order-2">
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

export function AsideNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-primary/30 pl-4">
      <p className="font-mono text-xs text-primary">{label}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
