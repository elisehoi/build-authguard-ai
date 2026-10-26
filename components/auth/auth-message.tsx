import { Fragment } from 'react'
import { DEMO_CONTACT_EMAIL } from '@/lib/auth/messages'

/** Renders an auth message as text, with the demo contact address as a mailto link. */
export function AuthMessage({ text }: { text: string }) {
  return text.split(DEMO_CONTACT_EMAIL).map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <a href={`mailto:${DEMO_CONTACT_EMAIL}`} className="font-medium underline underline-offset-4">
          {DEMO_CONTACT_EMAIL}
        </a>
      )}
      {part}
    </Fragment>
  ))
}
