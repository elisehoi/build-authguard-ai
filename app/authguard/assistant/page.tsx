import type { Metadata } from 'next'
import { AssistantChat } from '@/components/authguard/assistant-chat'

export const metadata: Metadata = { title: 'Assistant' }

export default function AssistantPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
        <p className="max-w-prose text-muted-foreground">
          Ask about the alerts and events from the last 7 days. It only sees what the console shows, with hashes shortened, and says so when it doesn&apos;t know.
        </p>
      </div>
      <div className="max-w-3xl">
        <AssistantChat />
      </div>
    </>
  )
}
