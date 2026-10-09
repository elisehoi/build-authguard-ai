// Shared by both products' login and signup forms (client-safe types only).
export type AuthField = 'email' | 'password' | 'confirmPassword'
export type AuthFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Partial<Record<AuthField, string>> }
  | { status: 'check-email'; email: string }

export type AuthFormAction = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>
export type GoogleAction = (formData: FormData) => Promise<void>
