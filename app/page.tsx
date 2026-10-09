import Image from 'next/image'
import { BrandMark } from '@/components/brand-mark'
import { ButtonLink } from '@/components/button-link'
import { getAuthContext } from '@/lib/services/auth-context'

const WORKSHOPS = [
  { title: 'Hand-cut dovetails', detail: 'Saturday, 6 hours', body: 'Mark, saw and chisel a drawer corner that fits without glue.', image: '/werkstatt/dovetail.png' },
  { title: 'Build a chair', detail: '3 weekends', body: 'Shape, steam and assemble a sturdy ash chair to take home.', image: '/werkstatt/chair.png' },
  { title: 'Oil and wax finishing', detail: 'Sunday, 3 hours', body: 'Prepare surfaces and apply a hard-wearing natural finish.', image: '/werkstatt/finishing.png' },
  { title: 'Spoon carving', detail: 'Evening, 2 hours', body: 'Start from a green branch and leave with a spoon you carved.', image: '/werkstatt/spoons.png' },
] as const

export default async function HomePage() {
  const context = await getAuthContext()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <BrandMark />
          <nav aria-label="Account" className="flex items-center gap-2">
            {context ? (
              <ButtonLink href="/account">My workshop notes</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
                <ButtonLink href="/signup">Sign up</ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-14 md:px-6 md:py-20">
          <p className="font-mono text-sm text-primary">Small-group classes in a real workshop</p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Learn to build with your hands, one joint at a time.
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Werkstatt is a six-bench woodworking shop. Pick a class, bring an apron, and keep notes on what you make in
            your own workshop journal.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={context ? '/account' : '/signup'} size="lg">{context ? 'Open my notes' : 'Sign up for classes'}</ButtonLink>
            {!context && <ButtonLink href="/login" size="lg" variant="outline">Log in</ButtonLink>}
          </div>
        </section>

        <section aria-labelledby="classes" className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
          <h2 id="classes" className="mb-6 text-2xl font-semibold tracking-tight">Upcoming classes</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSHOPS.map((workshop) => (
              <li key={workshop.title} className="flex flex-col overflow-hidden rounded-lg border bg-card">
                <Image src={workshop.image} alt="" width={600} height={450} className="aspect-4/3 w-full object-cover" />
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="font-medium">{workshop.title}</h3>
                  <p className="font-mono text-xs text-primary">{workshop.detail}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{workshop.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-relaxed text-muted-foreground md:px-6">
          Werkstatt woodworking school. Classes run Thursday to Sunday.
        </div>
      </footer>
    </div>
  )
}
