'use client'

import { useState, useTransition } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { startCheckout } from '@/app/(app)/billing/actions'
import { Button } from '@/components/ui/button'

export function UpgradeButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const result = await startCheckout()
            if (!result.ok) {
              setError(result.message)
              return
            }
            // Stripe Checkout refuses to load inside an iframe (like the v0 preview).
            if (window.self !== window.top) window.open(result.url, '_blank', 'noopener')
            else window.location.assign(result.url)
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
        Upgrade with Stripe
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
