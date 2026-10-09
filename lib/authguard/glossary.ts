// Static explanations for AuthGuard's <Explain> popovers. No AI is involved.
// In `body`, words wrapped in *asterisks* are highlighted. `aliases` are the
// phrases <ExplainText> looks for in generated text such as alert summaries.

export type GlossaryEntry = { title: string; body: string; aliases: readonly string[] }

export const GLOSSARY = {
  'access-token': {
    title: 'Access token',
    body: 'After a successful login, Supabase returns a *short-lived* access token, a signed *JWT*, that proves who you are on every request. It expires after about an hour, so a stolen one is only useful for a short time.',
    aliases: ['access token'],
  },
  'refresh-token': {
    title: 'Refresh token',
    body: 'A *long-lived* token issued together with the access token. It is used once to get a fresh access token when the old one expires. Logging out *revokes* it on the server, so a copied refresh token stops working.',
    aliases: ['refresh token'],
  },
  'session-cookie': {
    title: 'Session cookie',
    body: 'The server stores both tokens in a cookie named *sb-…-auth-token*. The browser sends it with every request, which is how the app knows you are still signed in. Anyone who copies this cookie can act as you until it expires.',
    aliases: ['session cookie', 'auth cookie'],
  },
  jwt: {
    title: 'JWT (JSON Web Token)',
    body: 'A token made of three parts: a header, a *payload of claims* (user id, expiry, session id) and a *signature*. Anyone can read the payload, but only the server holding the signing key can produce a valid signature, so edits are detected.',
    aliases: ['JWT', 'session claims'],
  },
  'session-reuse': {
    title: 'Session reuse',
    body: 'One session id seen from *different devices or networks*. A real user rarely switches browser mid-session, so this usually means the *session cookie was copied*, for example by malware or a shared computer.',
    aliases: ['session reuse', 'session theft', 'session token'],
  },
  'password-hashing': {
    title: 'Password hashing (bcrypt)',
    body: 'Your password goes to Supabase over HTTPS and is compared with a *bcrypt hash*. Nobody stores the password itself. bcrypt is *deliberately slow*, so guessing passwords from a stolen hash takes years instead of seconds.',
    aliases: ['bcrypt', 'password hashing'],
  },
  'breached-password': {
    title: 'Breached password',
    body: 'A password that already appears in *public breach data*. Attackers try these lists first. AuthGuard checks with *k-anonymity*: only the first characters of a hash leave the server, never the password.',
    aliases: ['breached password', 'public breach data', 'known data breach', 'breached'],
  },
  'password-strength': {
    title: 'Password strength',
    body: 'An estimate of how many guesses a password needs, scored *0 to 4*. Scores of 0 or 1 mean it is *easy to guess*: short, common, or built from names and dates.',
    aliases: ['password strength', 'easy to guess', 'guessability', 'weak password'],
  },
  'email-confirmation-link': {
    title: 'Email confirmation link (token_hash)',
    body: 'The link contains a *one-time token_hash*. Opening it proves you control the inbox, so nobody can sign up with *your address*. It works once and then expires.',
    aliases: ['confirmation link', 'token_hash'],
  },
  'account-enumeration': {
    title: 'Account enumeration',
    body: 'Checking which emails have accounts by watching how a form answers. The forms give the *same answer* whether or not an account exists, so they can\'t be used to check *who is registered*.',
    aliases: ['account enumeration', 'enumeration'],
  },
  'failed-login-burst': {
    title: 'Failed-login burst',
    body: 'Many *failed logins* for the same email in a few minutes. This is the typical pattern of *password guessing*. It becomes serious when a *successful login* follows.',
    aliases: ['failed-login burst', 'failed logins', 'password guessing'],
  },
  'tampered-token': {
    title: 'Tampered token',
    body: 'A session cookie that was present but *failed verification*. Its *signature* no longer matches, which happens when someone edits or forges a token, for example to change the user id.',
    aliases: ['tampered token', 'tampered', 'failed verification'],
  },
  'user-agent': {
    title: 'User agent',
    body: 'The text a browser sends to describe itself, such as *Chrome on Windows*. A login from a user agent never seen before for that user can mean a *new device*, or someone else.',
    aliases: ['user agent'],
  },
  'ip-hash': {
    title: 'IP hash',
    body: 'IP addresses are personal data, so AuthGuard only stores a *salted SHA-256 hash*. It can still tell *same network vs. different network*, but the original address cannot be recovered.',
    aliases: ['IP hash', 'hashed IP'],
  },
} as const satisfies Record<string, GlossaryEntry>

export type GlossaryTerm = keyof typeof GLOSSARY

// Detection rule id -> the glossary entry that explains it.
export const RULE_TERMS: Record<string, GlossaryTerm> = {
  'session-reuse': 'session-reuse',
  'failed-login-burst': 'failed-login-burst',
  'tampered-token': 'tampered-token',
  'breached-password': 'breached-password',
  'weak-password': 'password-strength',
  'new-device-login': 'user-agent',
}
