import { Fragment } from 'react'
import { GLOSSARY, type GlossaryTerm } from '@/lib/authguard/glossary'
import { Explain } from './explain'

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Longest aliases first, so "session cookie" wins over a shorter overlap.
const ALIASES = (Object.entries(GLOSSARY) as [GlossaryTerm, (typeof GLOSSARY)[GlossaryTerm]][])
  .flatMap(([term, entry]) => entry.aliases.map((alias) => ({ term, alias })))
  .sort((a, b) => b.alias.length - a.alias.length)
const PATTERN = new RegExp(`\\b(${ALIASES.map(({ alias }) => escape(alias)).join('|')})\\b`, 'gi')
const TERM_BY_ALIAS = new Map(ALIASES.map(({ term, alias }) => [alias.toLowerCase(), term]))

/** Plain text with the first mention of each glossary term wrapped in <Explain>. */
export function ExplainText({ text }: { text: string }) {
  const seen = new Set<GlossaryTerm>()
  return text.split(PATTERN).map((part, index) => {
    const term = index % 2 === 1 ? TERM_BY_ALIAS.get(part.toLowerCase()) : undefined
    if (!term || seen.has(term)) return <Fragment key={index}>{part}</Fragment>
    seen.add(term)
    return (
      <Explain key={index} term={term}>
        {part}
      </Explain>
    )
  })
}
