import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AsideNote, AuthShell } from '@/components/auth/auth-shell'
import { SignupForm } from '@/components/auth/signup-form'
import { getAuthContext } from '@/lib/services/auth-context'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignupPage() {
  if (await getAuthContext()) redirect('/dashboard')

  return (
    <AuthShell
      title="Create your account"
      description="You'll confirm your email before the lab opens."
      aside={
        <>
          <h2 className="text-lg font-semibold">Why confirm your email?</h2>
          <AsideNote label="Proof of ownership">
            The link contains a one-time token_hash. Opening it proves you control the inbox, so nobody can sign up with
            your address.
          </AsideNote>
          <AsideNote label="No enumeration">
            The form gives the same answer whether or not an account already exists, so it can&apos;t be used to check
            who is registered.
          </AsideNote>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
