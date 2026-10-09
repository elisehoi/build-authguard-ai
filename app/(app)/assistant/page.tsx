import type { Metadata } from 'next'
import { PageHeading } from '@/components/app/page-heading'
import { AssistantChat } from '@/components/assistant/assistant-chat'
import { loadProtectedPage } from '@/lib/services/protected-page'

export const metadata: Metadata = { title: 'AI Security Assistant' }

export default async function AssistantPage() {
  await loadProtectedPage('/assistant')

  return (
    <>
      <PageHeading eyebrow="AI Security Assistant" title="Ask how your login actually works">
        Answers are grounded in facts the server reads about this app and your current session. Your token itself is
        never sent to the model. When the facts don&apos;t cover a question, the assistant says so.
      </PageHeading>
      <AssistantChat />
    </>
  )
}
