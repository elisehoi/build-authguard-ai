'use client'

import { useState } from 'react'
import { Loader2, PenLine, ShieldAlert, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { postJson } from '@/lib/client/post-json'
import type { ReplayResult, TamperResult } from '@/lib/services/replay-service'
import { ReplayResultView, TamperResultView } from './replay-results'

type Busy = 'replay' | 'tamper' | 'explain' | null

export function ReplayLab({ cookieName }: { cookieName: string }) {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState<Busy>(null)
  const [replay, setReplay] = useState<ReplayResult | null>(null)
  const [tamper, setTamper] = useState<TamperResult | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: Exclude<Busy, null>) {
    setBusy(kind)
    setError(null)
    const url = kind === 'replay' ? '/api/demo/replay' : kind === 'tamper' ? '/api/demo/tamper' : '/api/demo/explain'
    const result = await postJson<unknown>(url, { token })
    setBusy(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (kind === 'replay') {
      setReplay(result.data as ReplayResult)
      setExplanation(null)
    } else if (kind === 'tamper') {
      setTamper(result.data as TamperResult)
    } else {
      setExplanation((result.data as { explanation: string }).explanation)
    }
  }

  const tokenReady = token.trim().length >= 20

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-labelledby="steal-heading" className="flex flex-col gap-4">
        <h2 id="steal-heading" className="text-lg font-semibold">
          1. Copy your token
        </h2>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Open your browser&apos;s developer tools, then the Application (or Storage) tab.</li>
          <li>
            Under Cookies, find <code className="break-all font-mono text-foreground">{cookieName}</code> (or its
            <code className="font-mono text-foreground"> .0</code> / <code className="font-mono text-foreground">.1</code> parts).
          </li>
          <li>Copy the value and paste it below. A raw JWT (eyJ…) works too.</li>
        </ol>

        <Alert>
          <ShieldAlert className="size-4" aria-hidden="true" />
          <AlertTitle>Only paste your own token</AlertTitle>
          <AlertDescription>
            This is exactly what malware or an XSS bug would steal. Never paste a token into a site you don&apos;t control.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Label htmlFor="token">Token or cookie value</Label>
          <Textarea
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={6}
            maxLength={12000}
            spellCheck={false}
            autoComplete="off"
            className="break-all font-mono text-xs"
            placeholder="base64-eyJ… or eyJhbGciOi…"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run('replay')} disabled={!tokenReady || busy !== null}>
            {busy === 'replay' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Replay as attacker
          </Button>
          <Button variant="outline" onClick={() => run('tamper')} disabled={!tokenReady || busy !== null}>
            {busy === 'tamper' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <PenLine className="size-4" aria-hidden="true" />
            )}
            Try to forge it
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section aria-labelledby="result-heading" className="flex flex-col gap-4" aria-live="polite">
        <h2 id="result-heading" className="text-lg font-semibold">
          2. See what happened
        </h2>
        {!replay && !tamper && (
          <p className="rounded-lg border border-dashed p-6 text-sm leading-relaxed text-muted-foreground">
            Results show up here. The replay sends your token to Supabase with no cookies attached, just like an
            attacker on another machine would.
          </p>
        )}
        {replay && <ReplayResultView result={replay} />}
        {tamper && <TamperResultView result={tamper} />}

        {replay && (
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="self-start" onClick={() => run('explain')} disabled={busy !== null || !tokenReady}>
              {busy === 'explain' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              Explain what this means
            </Button>
            {explanation && (
              <div className="rounded-md bg-accent p-4 text-sm leading-relaxed text-accent-foreground">
                <p className="whitespace-pre-wrap">{explanation}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
