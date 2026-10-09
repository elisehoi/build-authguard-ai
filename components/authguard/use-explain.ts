'use client'

import { useCallback, useState } from 'react'
import { postJson } from '@/lib/client/post-json'
import type { ExplainableField } from '@/lib/services/explain-service'

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; text: string }
  | { status: 'error'; message: string }

// Only the session id and field name are sent. The server rebuilds the claim
// values from stored events, so the AI cannot be asked to explain made-up data.
export function useExplain(sessionId: string, field: ExplainableField) {
  const [state, setState] = useState<ExplainState>({ status: 'idle' })

  const explain = useCallback(async () => {
    setState({ status: 'loading' })
    const result = await postJson<{ explanation: string }>('/api/authguard/explain-field', { sessionId, field })
    setState(result.ok ? { status: 'done', text: result.data.explanation } : { status: 'error', message: result.message })
  }, [sessionId, field])

  return { state, explain }
}
