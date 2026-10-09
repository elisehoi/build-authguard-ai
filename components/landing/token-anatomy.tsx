const SEGMENTS = [
  {
    label: 'Header',
    sample: 'eyJhbGciOiJIUzI1NiIs',
    tone: 'text-muted-foreground',
    note: 'Which algorithm signed it.',
  },
  {
    label: 'Payload',
    sample: 'eyJzdWIiOiI3ZjNhLi4u',
    tone: 'text-primary',
    note: 'Claims: who you are, your role, when it expires. Readable by anyone.',
  },
  {
    label: 'Signature',
    sample: 'Qm9yZWRfc2lnbmF0dXJl',
    tone: 'text-destructive',
    note: 'Proof the server wrote it. Change one character above and this no longer matches.',
  },
] as const

export function LandingTokenAnatomy() {
  return (
    <figure className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm md:p-6">
      <figcaption className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>access_token (JWT)</span>
        <span>header.payload.signature</span>
      </figcaption>
      <p className="break-all rounded-md bg-muted p-3 font-mono text-sm leading-relaxed">
        {SEGMENTS.map((segment, index) => (
          <span key={segment.label}>
            <span className={segment.tone}>{segment.sample}</span>
            {index < SEGMENTS.length - 1 && <span className="text-foreground">.</span>}
          </span>
        ))}
      </p>
      <dl className="flex flex-col gap-3">
        {SEGMENTS.map((segment) => (
          <div key={segment.label} className="flex gap-3">
            <dt className={`w-20 shrink-0 font-mono text-sm font-medium ${segment.tone}`}>{segment.label}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{segment.note}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
