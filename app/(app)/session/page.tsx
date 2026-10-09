import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeading } from '@/components/app/page-heading'
import { ClaimsInspector, type ClaimView } from '@/components/session/claims-inspector'
import { loadProtectedPage } from '@/lib/services/protected-page'
import { getAuthCookieName } from '@/lib/supabase/cookie-name'

export const metadata: Metadata = { title: 'Token Inspector' }

export default async function SessionPage() {
  const { claims } = await loadProtectedPage('/session')
  // No readable token means the session is gone or broken: send the user to log in
  // again instead of rendering a half-empty page.
  if (!claims) redirect('/login?next=/session')

  // Only decoded, display-ready values cross to the client. The raw JWT string
  // stays on the server, so it can never leak through props or page HTML.
  const view: ClaimView = {
    sub: claims.sub,
    email: claims.email ?? null,
    role: claims.role ?? null,
    aud: Array.isArray(claims.aud) ? claims.aud.join(', ') : (claims.aud ?? null),
    iat: claims.iat ?? null,
    exp: claims.exp ?? null,
    session_id: claims.session_id ?? null,
    provider: claims.app_metadata?.provider ?? null,
    cookieName: getAuthCookieName(),
  }

  return (
    <>
      <PageHeading eyebrow="Token Inspector" title="Your access token, decoded">
        A JWT payload is only base64, so anyone holding the token can read these claims. What they cannot do is change
        them: the signature would no longer match. Press &ldquo;Explain&rdquo; on any card for a plain-language
        walkthrough.
      </PageHeading>
      <ClaimsInspector claims={view} />
    </>
  )
}
