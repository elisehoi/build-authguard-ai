'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { AuthFormAction, AuthFormState, GoogleAction } from '@/lib/auth/form-state'
import { AuthMessage } from './auth-message'
import { FormField } from './form-field'
import { GoogleButton } from './google-button'

const initialState: AuthFormState = { status: 'idle' }

type SignupFormProps = {
  action: AuthFormAction
  /** Omit when Google sign-in is not enabled for the product's project. */
  googleAction?: GoogleAction
  loginHref: string
  /** Shown above the form until the visitor submits it, e.g. when the database is asleep. */
  notice?: string
}

// Used by both products; each passes its own server actions and links.
export function SignupForm({ action: signupAction, googleAction, loginHref, notice }: SignupFormProps) {
  const [state, action, pending] = useActionState(signupAction, initialState)

  if (state.status === 'check-email') {
    return (
      <Alert>
        <MailCheck className="size-4" aria-hidden="true" />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription className="leading-relaxed">
          If {state.email} can be used, a confirmation link is on its way. Open it to finish signing up.
        </AlertDescription>
      </Alert>
    )
  }

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined

  const message = state.status === 'error' ? state.message : notice

  return (
    <div className="flex flex-col gap-5">
      {message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            <p><AuthMessage text={message} /></p>
          </AlertDescription>
        </Alert>
      )}
      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormField name="email" label="Email" type="email" autoComplete="email" required error={fieldErrors?.email} />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="8 to 72 characters."
          error={fieldErrors?.password}
        />
        <FormField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={fieldErrors?.confirmPassword}
        />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      {googleAction && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton action={googleAction} />
        </>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
