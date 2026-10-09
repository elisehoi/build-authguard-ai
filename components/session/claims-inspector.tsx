'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ClaimCard } from './claim-card'
import { ExpiryCountdown } from './expiry-countdown'
import { LocalTime } from '@/components/local-time'
import type { ExplainLevel } from './use-explain'

export type ClaimView = {
  sub: string
  email: string | null
  role: string | null
  aud: string | null
  iat: number | null
  exp: number | null
  session_id: string | null
  provider: string | null
  cookieName: string
}

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString()

export function ClaimsInspector({ claims }: { claims: ClaimView }) {
  const [level, setLevel] = useState<ExplainLevel>('beginner')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Signed in via <span className="font-mono text-foreground">{claims.provider ?? 'unknown'}</span>
        </p>
        <div className="flex items-center gap-3">
          <Label htmlFor="level" className={level === 'beginner' ? 'text-foreground' : 'text-muted-foreground'}>
            Beginner
          </Label>
          <Switch
            id="level"
            checked={level === 'technical'}
            onCheckedChange={(checked) => setLevel(checked ? 'technical' : 'beginner')}
            aria-label="Explanation level: technical"
          />
          <Label htmlFor="level" className={level === 'technical' ? 'text-foreground' : 'text-muted-foreground'}>
            Technical
          </Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ClaimCard field="sub" label="sub" title="User id" level={level} hint="Who this token belongs to. RLS compares it with notes.user_id.">
          <code className="break-all">{claims.sub}</code>
        </ClaimCard>
        <ClaimCard field="email" label="email" title="Email" level={level} hint="Copied from your account at sign-in time.">
          <code className="break-all">{claims.email ?? '—'}</code>
        </ClaimCard>
        <ClaimCard field="role" label="role" title="Database role" level={level} hint="The Postgres role used for your queries.">
          <code>{claims.role ?? '—'}</code>
        </ClaimCard>
        <ClaimCard field="aud" label="aud" title="Audience" level={level} hint="Who the token is meant for.">
          <code>{claims.aud ?? '—'}</code>
        </ClaimCard>
        <ClaimCard field="iat" label="iat" title="Issued at" level={level} hint="When Supabase created this token.">
          {claims.iat ? <LocalTime iso={toIso(claims.iat)} /> : '—'}
        </ClaimCard>
        <ClaimCard field="exp" label="exp" title="Expires" level={level} hint="After this, the token is rejected and silently refreshed." emphasis>
          {claims.exp ? (
            <div className="flex flex-col gap-1">
              <LocalTime iso={toIso(claims.exp)} />
              <ExpiryCountdown exp={claims.exp} />
            </div>
          ) : (
            '—'
          )}
        </ClaimCard>
        <ClaimCard field="session_id" label="session_id" title="Session" level={level} hint="Ties every refreshed token to this one login.">
          <code className="break-all">{claims.session_id ?? '—'}</code>
        </ClaimCard>
        <ClaimCard
          field="storage"
          label="storage"
          title="Where it lives"
          level={level}
          hint="An @supabase/ssr cookie. Only the name is shown, never the value."
        >
          <code className="break-all">{claims.cookieName}</code>
          <span className="block text-xs text-muted-foreground">may be split into .0 / .1 chunks</span>
        </ClaimCard>
      </div>
    </div>
  )
}
