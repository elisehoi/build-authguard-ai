'use client'

import { useCallback, useState } from 'react'
import { postJson } from '@/lib/client/post-json'

export type ExplainField = 'sub' | 'email' | 'role' | 'aud' | 'iat' | 'exp' | 'session_id' | 'storage'
export type ExplainLevel = 'beginner' | 'technical'

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; text: string }
  | { status: 'error'; message: string }

// Only the field name and level are sent. The server re-reads the real claim
// values from the session cookie, so a user cannot make the AI "explain" fake data.
export function useExplain(field: ExplainField) {
  const [state, setState] = useState<ExplainState>({ status: 'idle' })

  const explain = useCallback(
    async (level: ExplainLevel) => {
      setState({ status: 'loading' })
      const result = await postJson<{ explanation: string }>('/api/explain', { field, level })
      setState(result.ok ? { status: 'done', text: result.data.explanation } : { status: 'error', message: result.message })
    },
    [field],
  )

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, explain, reset }
}
