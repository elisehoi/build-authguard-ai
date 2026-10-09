export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        <p className="font-mono text-xs text-primary">{eyebrow}</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="text-pretty leading-relaxed text-muted-foreground">{children}</div>
      </div>
      {action}
    </div>
  )
}
