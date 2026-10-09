'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Loader2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const MAX_CHARS = 500

const SUGGESTIONS = [
  'What are the most serious alerts right now?',
  'Which accounts had a failed-login burst?',
  'Were any breached passwords used at signup?',
  'Summarize the last 24 hours.',
] as const

export function AssistantChat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/authguard/assistant' }),
  })
  const busy = status === 'submitted' || status === 'streaming'

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy || trimmed.length > MAX_CHARS) return
    sendMessage({ text: trimmed })
    setInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-80 flex-col gap-4 rounded-lg border bg-card p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" onClick={() => submit(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const text = message.parts
              .map((part) => (part.type === 'text' ? part.text : ''))
              .join('')
            const isUser = message.role === 'user'
            return (
              <div key={message.id} className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
                <span className="font-mono text-xs text-muted-foreground">{isUser ? 'You' : 'Assistant'}</span>
                <p
                  className={cn(
                    'max-w-prose whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed',
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {text}
                </p>
              </div>
            )
          })
        )}
        {status === 'submitted' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Thinking…
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            The assistant couldn&apos;t answer. If your login expired, sign in again; otherwise try once more.
          </p>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit(input)
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="question" className="sr-only">
          Your question
        </Label>
        <div className="flex items-end gap-2">
          <Textarea
            id="question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              if (event.nativeEvent.isComposing || event.keyCode === 229) return
              event.preventDefault()
              submit(input)
            }}
            maxLength={MAX_CHARS}
            rows={2}
            placeholder="Ask about alerts and events…"
            className="resize-none"
          />
          {busy ? (
            <Button type="button" size="icon" variant="outline" onClick={stop} aria-label="Stop generating">
              <Square className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send question">
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <p className="text-right font-mono text-xs text-muted-foreground">
          {input.length}/{MAX_CHARS}
        </p>
      </form>
    </div>
  )
}
