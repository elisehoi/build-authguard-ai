'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { login, type AuthFormState } from '@/app/auth/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WERKSTATT_SIGNUP } from '@/lib/routes'
import { FormField } from './form-field'
import { GoogleButton } from './google-button'

const initialState: AuthFormState = { status: 'idle' }

export function LoginForm({ next, urlError }: { next?: string; urlError?: string }) {
  const [state, action, pending] = useActionState(login, initialState)
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined
  const message = state.status === 'error' ? state.message : urlError

  return (
    <div className="flex flex-col gap-5">
      {message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{message}</AlertDescription>
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
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={next} />
      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href={WERKSTATT_SIGNUP} className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
