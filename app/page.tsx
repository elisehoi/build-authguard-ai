import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, KeyRound, ShieldCheck, UserX } from 'lucide-react'
import { ExplainText } from '@/components/authguard/explain-text'
import { ButtonLink } from '@/components/button-link'
import { authGuardMetadata, authGuardViewport } from '@/lib/authguard/metadata'
import { AUTHGUARD_LOGIN, AUTHGUARD_SIGNUP, WERKSTATT_HOME } from '@/lib/routes'

export const metadata: Metadata = { ...authGuardMetadata, title: { absolute: 'AuthGuard — account security, monitored' } }
export const viewport = authGuardViewport

const FEATURES = [
  {
    icon: UserX,
    title: 'Flags signs of session theft',
    body: 'Spots session reuse from a second device, a tampered token presented to your app, and logins from a user agent never seen before.',
  },
  {
    icon: KeyRound,
    title: 'Catches weak and breached passwords',
    body: 'Checks password strength and flags any breached password at signup and login, without ever storing or sending the password itself.',
  },
  {
    icon: FileText,
    title: 'Explains every alert and writes security reports',
    body: 'From a failed-login burst to session theft: each alert comes with a plain-language explanation and the evidence behind it, ready to share.',
  },
] as const

// The root route is AuthGuard's landing page; Werkstatt lives under /werkstatt.
export default function HomePage() {
  return (
    <div className="theme-authguard flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            AuthGuard
          </Link>
          <ButtonLink href={AUTHGUARD_LOGIN} variant="ghost">Sign in</ButtonLink>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 md:px-6 md:py-28">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Account security, monitored
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            AuthGuard flags account-security issues in your app and explains them in plain language
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={AUTHGUARD_LOGIN} size="lg" className="h-11 px-5">Sign in to AuthGuard</ButtonLink>
            <ButtonLink href={AUTHGUARD_SIGNUP} size="lg" variant="outline" className="h-11 px-5">Create an account</ButtonLink>
          </div>
        </section>

        <section aria-label="Features" className="border-y bg-muted">
          <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3 md:px-6 md:py-20">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-3 rounded-lg border bg-card p-6 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-semibold tracking-tight">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground"><ExplainText text={body} /></p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer>
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm md:px-6">
          <Link href={WERKSTATT_HOME} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Open the demo client app (Werkstatt)
          </Link>
        </div>
      </footer>
    </div>
  )
}
