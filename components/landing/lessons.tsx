import { Bot, FileSearch, KeyRound, Siren, StickyNote } from 'lucide-react'

const LESSONS = [
  {
    icon: StickyNote,
    title: 'Row Level Security',
    body: 'Write private notes. The database itself refuses to show them to anyone else, even with the same API key.',
  },
  {
    icon: FileSearch,
    title: 'Token Inspector',
    body: 'Decode your own JWT claim by claim, watch the expiry count down, and ask the AI what each field means.',
  },
  {
    icon: KeyRound,
    title: 'Stolen token replay',
    body: 'Copy your cookie like an attacker would and see what it unlocks, what it cannot do, and why tampering fails.',
  },
  {
    icon: Siren,
    title: 'Detection rules',
    body: 'Plain code flags replayed tokens, new devices and failed-login bursts, then cites the exact events.',
  },
  {
    icon: Bot,
    title: 'An AI that only explains',
    body: 'Answers come from facts the server computed. It never decides whether something is secure.',
  },
] as const

export function LandingLessons() {
  return (
    <section aria-labelledby="lessons-heading" className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:px-6">
        <h2 id="lessons-heading" className="text-balance text-2xl font-semibold tracking-tight">
          What you&apos;ll learn by doing
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-2">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
