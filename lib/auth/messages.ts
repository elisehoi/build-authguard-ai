// Every message a login page can show from its URL. Redirects carry only a
// short code (?error=unavailable), never free text, so a crafted link cannot
// put arbitrary words on a genuine login page. Unknown codes show nothing.

/** Who to contact to switch the demo databases back on. */
export const DEMO_CONTACT_EMAIL = 'elise.hoimyr01630@laposte.net'

export const AUTH_ERROR_MESSAGES = {
  unavailable: `Sign-in isn't available right now: this demo's database is paused when nobody has used it for a while. Email ${DEMO_CONTACT_EMAIL} and it will be switched back on.`,
  oauth_failed: 'Sign-in was cancelled or failed. Please try again.',
  link_incomplete: 'The sign-in link is incomplete. Please try again.',
  link_expired:
    'This link has expired, was already used, or was opened in a different browser. If you were confirming your email, try logging in.',
  google_unavailable: 'Google sign-in is not available right now.',
} as const

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES

export function authErrorMessage(code: string | string[] | undefined): string | undefined {
  return typeof code === 'string' && Object.hasOwn(AUTH_ERROR_MESSAGES, code) ? AUTH_ERROR_MESSAGES[code as AuthErrorCode] : undefined
}

/** `${path}?error=code`, plus `next` when given. */
export function withAuthError(path: string, code: AuthErrorCode, next?: string): string {
  const params = new URLSearchParams({ error: code })
  if (next) params.set('next', next)
  return `${path}?${params.toString()}`
}
