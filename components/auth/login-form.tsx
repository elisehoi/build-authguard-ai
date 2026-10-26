'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { AuthFormAction, AuthFormState, GoogleAction } from '@/lib/auth/form-state'
import { AuthMessage } from './auth-message'
import { FormField } from './form-field'
import { GoogleButton } from './google-button'

const initialState: AuthFormState = { status: 'idle' }

type LoginFormProps = {
  action: AuthFormAction
  /** Omit when Google sign-in is not enabled for the product's project. */
  googleAction?: GoogleAction
  signupHref: string
  next?: string
  urlError?: string
}

// Used by both products; each passes its own server actions and links.
export function LoginForm({ action: loginAction, googleAction, signupHref, next, urlError }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, initialState)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const message = state.status === 'error' ? state.message : urlError

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
        {next && <input type="hidden" name="next" value={next} />}
        <FormField name="email" label="Email" type="email" autoComplete="email" required error={fieldErrors?.email} />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={fieldErrors?.password}
        />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {pending ? 'Signing in…' : 'Log in'}
        </Button>
      </form>
      {googleAction && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton action={googleAction} next={next} />
        </>
      )}
      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href={signupHref} className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
